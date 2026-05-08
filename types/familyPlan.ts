// ============================================================
// Grandma's Cookbook — Family Plan Types
// Mirrors the schema in supabase/migrations/20240001000000_family_plans.sql
// ============================================================

// ------------------------------------------------------------
// family_plans
// ------------------------------------------------------------

export type FamilyPlanStatus = "active" | "cancelled" | "expired";

export interface FamilyPlan {
  id: string;
  owner_user_id: string;
  plan_status: FamilyPlanStatus;
  max_members: number;
  created_at: string;
}

export interface FamilyPlanInsert {
  id?: string;
  owner_user_id: string;
  plan_status?: FamilyPlanStatus;
  max_members?: number;
  created_at?: string;
}

// ------------------------------------------------------------
// family_memberships
// ------------------------------------------------------------

export type MemberRole = "owner" | "member";

export interface FamilyMembership {
  id: string;
  plan_id: string;
  user_id: string;
  role: MemberRole;
  display_name: string;
  invited_by: string | null;
  joined_at: string;
}

export interface FamilyMembershipInsert {
  id?: string;
  plan_id: string;
  user_id: string;
  role?: MemberRole;
  display_name: string;
  invited_by?: string | null;
  joined_at?: string;
}

// ------------------------------------------------------------
// family_invites
// ------------------------------------------------------------

export type InviteRole = "member";
export type InviteStatus = "pending" | "accepted" | "expired" | "cancelled";

export interface FamilyInvite {
  id: string;
  plan_id: string;
  email: string;
  role: InviteRole;
  invite_token: string;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
}

export interface FamilyInviteInsert {
  id?: string;
  plan_id: string;
  email: string;
  role?: InviteRole;
  invite_token?: string;
  status?: InviteStatus;
  expires_at?: string;
  created_at?: string;
}

// ------------------------------------------------------------
// recipes
// ------------------------------------------------------------

export interface Recipe {
  id: string;
  plan_id: string;
  created_by_user_id: string | null;
  owner_membership_id: string | null;
  title: string;
  content: unknown | null; // jsonb — cast to your own shape when consuming
  folder_slug: string | null;
  created_at: string;
}

export interface RecipeInsert {
  id?: string;
  plan_id: string;
  created_by_user_id?: string | null;
  owner_membership_id?: string | null;
  title: string;
  content?: unknown | null;
  folder_slug?: string | null;
  created_at?: string;
}

// ------------------------------------------------------------
// Composite types used by service functions
// ------------------------------------------------------------

export interface HomeScreenData {
  members: FamilyMembership[];
  /** Keys are owner_membership_id; "unassigned" collects recipes where it is null */
  recipesByMember: Record<string, Recipe[]>;
}
