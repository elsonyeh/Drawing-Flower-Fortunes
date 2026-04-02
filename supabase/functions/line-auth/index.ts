import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const { code, redirectUri, linkUserId } = await req.json()

    // 1. 換 LINE token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: Deno.env.get('LINE_CLIENT_ID')!,
      client_secret: Deno.env.get('LINE_CLIENT_SECRET')!,
    })

    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    })
    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error('LINE token 失敗: ' + JSON.stringify(tokenData))
    }

    // 2. 取得 LINE 用戶資料
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileRes.json()

    if (!profileRes.ok) {
      throw new Error('LINE 用戶資料失敗: ' + JSON.stringify(profile))
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const origin = new URL(redirectUri).origin

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // ── 連結模式：將 LINE 綁定到現有帳號 ──────────────────────────────
    if (linkUserId) {
      // 取得現有帳號（Google 帳號）
      const { data: { user: existingUser }, error: getUserError } =
        await supabaseAdmin.auth.admin.getUserById(linkUserId)

      if (getUserError || !existingUser) {
        throw new Error('找不到目標帳號: ' + (getUserError?.message ?? ''))
      }

      // 將 LINE user_id 寫入帳號 metadata
      await supabaseAdmin.auth.admin.updateUserById(linkUserId, {
        user_metadata: {
          ...existingUser.user_metadata,
          line_user_id: profile.userId,
        },
      })

      // 將 LINE user_id 寫入 profiles 表
      await supabaseAdmin
        .from('profiles')
        .update({ linked_line_id: profile.userId })
        .eq('id', linkUserId)

      // 對原帳號產生 magic link（保持登入同一帳號）
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: existingUser.email!,
          options: { redirectTo: origin },
        })

      if (linkError || !linkData?.properties?.hashed_token) {
        throw new Error('generateLink 失敗: ' + linkError?.message)
      }

      return new Response(JSON.stringify({
        action_link: linkData.properties.action_link,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 一般登入：先查此 LINE ID 是否已連結到某帳號 ──────────────────
    const { data: linkedProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('linked_line_id', profile.userId)
      .maybeSingle()

    if (linkedProfile) {
      // 找到連結的帳號，為那個帳號建立 session
      const { data: { user: linkedUser }, error: linkedUserError } =
        await supabaseAdmin.auth.admin.getUserById(linkedProfile.id)

      if (linkedUserError || !linkedUser) {
        throw new Error('找不到連結帳號: ' + (linkedUserError?.message ?? ''))
      }

      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: linkedUser.email!,
          options: { redirectTo: origin },
        })

      if (linkError || !linkData?.properties?.hashed_token) {
        throw new Error('generateLink 失敗: ' + linkError?.message)
      }

      return new Response(JSON.stringify({
        action_link: linkData.properties.action_link,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 新用戶或現有 LINE 用戶：正常流程 ─────────────────────────────
    const email = `line_${profile.userId}@line.user`

    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: profile.displayName,
        avatar_url: profile.pictureUrl,
        line_user_id: profile.userId,
        provider: 'line',
      },
    })

    if (createError &&
        !createError.message.includes('already been registered') &&
        !createError.message.includes('already registered')) {
      throw new Error('建立用戶失敗: ' + createError.message)
    }

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: origin },
      })

    if (linkError || !linkData?.properties?.hashed_token) {
      throw new Error('generateLink 失敗: ' + linkError?.message)
    }

    return new Response(JSON.stringify({
      action_link: linkData.properties.action_link,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[line-auth] error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
