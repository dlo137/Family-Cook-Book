/**
 * services/familyPlanService.ts — Family Plan Service
 *
 * RELATED FILES:
 *   - types/familyPlan.ts          → All types used here
 *   - lib/supabase.ts              → Supabase client
 *   - supabase/migrations/...      → Schema & RLS policies
 *
 * NOTE ON AUTHORIZATION:
 *   Insert/update/delete operations rely on RLS to enforce ownership.
 *   The helpers here do not duplicate those checks in JS — they trust
 *   the database to reject unauthorized calls and surface the error.
 */

import { supabase } from "@/lib/supabase";
import type {
  FamilyInvite,
  FamilyMembership,
  FamilyPlan,
  HomeScreenData,
  Recipe,
} from "@/types/familyPlan";

// ------------------------------------------------------------
// createFamilyPlan
// ------------------------------------------------------------

/**
 * Atomically creates a new family plan and inserts the caller as the owner
 * member in a single Postgres transaction via RPC.
 * Returns the newly created plan row.
 */
export async function createFamilyPlan(
  ownerUserId: string,
  displayName: string
): Promise<FamilyPlan> {
  const { data, error } = await supabase.rpc("create_family_plan", {
    p_owner_user_id: ownerUserId,
    p_display_name: displayName,
  });

  if (error || !data) {
    throw new Error(
      `[familyPlanService] Failed to create family plan: ${error?.message ?? "no data returned"}`
    );
  }

  return data as FamilyPlan;
}

// ------------------------------------------------------------
// inviteMember
// ------------------------------------------------------------

/**
 * Creates a pending invite for the given email address.
 * Returns the full invite row including the generated token.
 * Caller must be the plan owner (enforced by RLS).
 */
export async function inviteMember(
  planId: string
): Promise<FamilyInvite> {
  const role = "member";
  const { data, error } = await supabase
    .from("family_invites")
    .insert({ plan_id: planId, role })
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `[familyPlanService] Failed to create invite for ${email}: ${error?.message ?? "no data returned"}`
    );
  }

  return data as FamilyInvite;
}

// ------------------------------------------------------------
// acceptInvite
// ------------------------------------------------------------

/**
 * Atomically accepts a pending invite by token via RPC.
 * The Postgres function validates the invite, inserts the membership,
 * and marks the invite accepted — all in one transaction with row-level locking.
 * Returns the new membership row.
 */
export async function acceptInvite(
  token: string,
  userId: string,
  displayName: string
): Promise<FamilyMembership> {
  const { data, error } = await supabase.rpc("accept_family_invite", {
    p_token: token,
    p_user_id: userId,
    p_display_name: displayName,
  });

  if (error) {
    // Map the error codes raised by the Postgres function to user-friendly messages
    const msg: string = error.message ?? "";
    if (msg.includes("INVITE_NOT_FOUND")) {
      throw new Error(`[familyPlanService] Invite not found for the provided token.`);
    }
    if (msg.includes("INVITE_NOT_PENDING")) {
      throw new Error(`[familyPlanService] Invite is no longer valid (status: ${error.details ?? "not pending"}).`);
    }
    if (msg.includes("INVITE_EXPIRED")) {
      throw new Error(`[familyPlanService] Invite has expired.`);
    }
    if (msg.includes("ALREADY_MEMBER")) {
      throw new Error(`[familyPlanService] User is already a member of this family plan.`);
    }
    throw new Error(`[familyPlanService] Failed to accept invite: ${msg}`);
  }

  if (!data) {
    throw new Error(`[familyPlanService] Accept invite returned no data.`);
  }

  return data as FamilyMembership;
}

// ------------------------------------------------------------
// getPlanWithMembers
// ------------------------------------------------------------

/**
 * Fetches a family plan and all its memberships in a single query
 * using Supabase's nested select syntax.
 */
export async function getPlanWithMembers(
  planId: string
): Promise<{ plan: FamilyPlan; members: FamilyMembership[] }> {
  const { data, error } = await supabase
    .from("family_plans")
    .select("*, family_memberships(*)")
    .eq("id", planId)
    .single();

  if (error || !data) {
    throw new Error(
      `[familyPlanService] Failed to fetch plan ${planId}: ${error?.message ?? "no data returned"}`
    );
  }

  const { family_memberships: members, ...plan } = data as any;

  return {
    plan: plan as FamilyPlan,
    members: (members ?? []) as FamilyMembership[],
  };
}

// ------------------------------------------------------------
// getHomeScreenData
// ------------------------------------------------------------

/**
 * Fetches all members and all recipes for a plan.
 * Recipes are grouped by owner_membership_id.
 * Recipes with no owner_membership_id are filed under "unassigned".
 */
export async function getHomeScreenData(
  planId: string
): Promise<HomeScreenData> {
  const [membersResult, recipesResult] = await Promise.all([
    supabase
      .from("family_memberships")
      .select("*")
      .eq("plan_id", planId),
    supabase
      .from("recipes")
      .select("*")
      .eq("plan_id", planId),
  ]);

  if (membersResult.error) {
    throw new Error(
      `[familyPlanService] Failed to fetch members for plan ${planId}: ${membersResult.error.message}`
    );
  }

  if (recipesResult.error) {
    throw new Error(
      `[familyPlanService] Failed to fetch recipes for plan ${planId}: ${recipesResult.error.message}`
    );
  }

  const members = (membersResult.data ?? []) as FamilyMembership[];
  const recipes = (recipesResult.data ?? []) as Recipe[];

  const recipesByMember: Record<string, Recipe[]> = {};

  for (const recipe of recipes) {
    const key = recipe.owner_membership_id ?? "unassigned";
    if (!recipesByMember[key]) {
      recipesByMember[key] = [];
    }
    recipesByMember[key].push(recipe);
  }

  return { members, recipesByMember };
}

// ------------------------------------------------------------
// removeMember
// ------------------------------------------------------------

/**
 * Deletes a membership row by ID.
 * RLS enforces that only the plan owner can delete memberships.
 */
export async function removeMember(
  planId: string,
  membershipId: string
): Promise<void> {
  const { error } = await supabase
    .from("family_memberships")
    .delete()
    .eq("id", membershipId)
    .eq("plan_id", planId); // belt-and-suspenders: scope to the correct plan

  if (error) {
    throw new Error(
      `[familyPlanService] Failed to remove member ${membershipId}: ${error.message}`
    );
  }
}
