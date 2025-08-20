/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user from the request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    // Verify the user token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { password } = await req.json()

    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password: password
    })

    if (signInError) {
      return new Response(
        JSON.stringify({ error: 'Invalid password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 1: Delete private user data (using RLS bypass with admin client)
    await Promise.allSettled([
      supabaseAdmin.from('user_preferences').delete().eq('user_id', user.id),
      supabaseAdmin.from('visualizations').delete().eq('user_id', user.id).eq('is_public', false),
      supabaseAdmin.from('comments').delete().eq('user_id', user.id),
      supabaseAdmin.from('likes').delete().eq('user_id', user.id),
      supabaseAdmin.from('follows').delete().or(`follower_id.eq.${user.id},following_id.eq.${user.id}`)
    ])

    // Step 2: Anonymize public content
    const anonymousId = `deleted_${user.id.substring(0, 8)}`
    
    await Promise.allSettled([
      supabaseAdmin.from('profiles').update({ 
        username: anonymousId,
        full_name: 'Deleted User',
        bio: null,
        avatar_url: null,
        banner_url: null
      }).eq('id', user.id),
      
      supabaseAdmin.from('visualizations').update({
        title: 'Visualization by Deleted User',
        description: 'This visualization was created by a deleted user account.',
        is_public: false,
        tags: []
      }).eq('user_id', user.id).eq('is_public', true)
    ])

    // Step 3: Delete the auth user (only admin can do this)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError)
      // Continue - data cleanup is more important
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Delete user error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})