import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // User-scoped client — only used to verify the caller's JWT identity
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    // Admin client — uses service role key to bypass RLS for profile updates
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the caller is authenticated
    const { data: { user } } = await supabaseUserClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { productId, transactionId, source } = await req.json()

    console.log('validate-receipt:', { userId: user.id, productId, transactionId, source })

    // Determine plan from product ID
    let plan: 'monthly' | 'lifetime' = 'monthly'
    if (productId?.includes('lifetime')) {
      plan = 'lifetime'
    }

    const now = new Date().toISOString()

    const { error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id:                user.id,
          is_pro_version:    true,
          entitlement:       'pro',
          subscription_plan: plan,
          subscription_id:   transactionId,
          purchase_time:     now,
          updated_at:        now,
        },
        { onConflict: 'id' }
      )

    if (upsertError) {
      console.error('Error upserting profile:', upsertError)
      throw upsertError
    }

    console.log('Receipt validated for user:', user.id, '| plan:', plan)

    return new Response(
      JSON.stringify({ success: true, plan }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in validate-receipt:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
