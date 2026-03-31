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
    const { code, redirectUri } = await req.json()

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
    const email = `line_${profile.userId}@line.user`

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 3. 建立用戶（已存在則忽略錯誤）
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

    // 只有非「用戶已存在」的錯誤才拋出
    if (createError && !createError.message.includes('already been registered') && !createError.message.includes('already registered')) {
      throw new Error('建立用戶失敗: ' + createError.message)
    }

    // 4. 產生 magic link，跳回前端原始網址
    const origin = new URL(redirectUri).origin
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: origin },
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      throw new Error('generateLink 失敗: ' + linkError?.message)
    }

    // 5. 回傳 action_link，讓前端直接跳轉，Supabase 自動建立 session
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
