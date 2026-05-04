import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import nodemailer from 'npm:nodemailer@6.9.7'

const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? ''
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, displayName, prizeRank } = await req.json()
    if (!email) {
      return new Response(JSON.stringify({ error: 'email required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const name = displayName || '花語旅人'

    const html = `
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>埕花 — 隱藏成就解鎖</title>
</head>
<body style="margin:0;padding:0;background-color:#0e142a;font-family:'Helvetica Neue',Arial,sans-serif;color:#f2d9d0;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0e142a" style="background-color:#0e142a;">
    <tr>
      <td align="center" style="padding:48px 16px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <div style="font-size:38px;letter-spacing:6px;color:#F2BE5C;font-weight:700;margin-bottom:4px;text-shadow:0 0 18px rgba(242,190,92,0.6);">埕花</div>
              <div style="font-size:11px;letter-spacing:3px;color:rgba(242,217,208,0.35);margin-bottom:6px;">CHENG FLOWERS</div>
              <div style="font-size:12px;letter-spacing:1px;color:rgba(242,217,208,0.4);">花轟 ✕ 2026 鹽夏不夜埕</div>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:linear-gradient(160deg,rgba(242,126,147,0.10) 0%,rgba(242,190,92,0.05) 100%);border:1px solid rgba(242,126,147,0.20);border-radius:18px;padding:32px 28px;">

              <div style="text-align:center;font-size:38px;margin-bottom:18px;">🌸✨</div>

              <h1 style="margin:0 0 6px;font-size:21px;font-weight:700;color:#f2d9d0;letter-spacing:1.5px;text-align:center;">隱藏成就解鎖</h1>
              <p style="margin:0 0 24px;font-size:12px;color:rgba(242,217,208,0.45);letter-spacing:2px;text-align:center;">十五種花語 · 任務達成</p>

              <!-- 稱謂 -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(242,190,92,0.07);border:1px solid rgba(242,190,92,0.18);border-radius:12px;padding:16px 20px;margin-bottom:20px;">
                    <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:rgba(242,217,208,0.92);">
                      親愛的 <strong style="color:#F2BE5C;">${name}</strong>，
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.95;color:rgba(242,217,208,0.72);">
                      恭喜你踏遍鹽埕，探訪全部 15 件裝置藝術，並在圖鑑中蒐集了 15 種以上的花語。<br />
                      你是本次活動第 <strong style="color:#f27e93;font-size:15px;">${prizeRank}</strong> 位完成隱藏任務的旅人。<br />
                      這是屬於你的成就——每一件作品都是一段對話，你沒有錯過任何一句。
                    </p>
                  </td>
                </tr>
              </table>

              <div style="height:18px;"></div>

              <!-- 領獎說明 -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(242,126,147,0.07);border:1px solid rgba(242,126,147,0.18);border-radius:12px;padding:18px 20px;">
                    <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#f27e93;letter-spacing:0.5px;">🎁 隱藏任務限定好禮 — 領獎說明</p>
                    <p style="margin:0 0 12px;font-size:13px;line-height:1.85;color:rgba(242,217,208,0.78);">
                      領獎時間：<strong style="color:#F2BE5C;">2026/5/16（六）、5/17（日）、5/23（六）17:00–21:00</strong><br />
                      請於活動期間內<strong style="color:#f2d9d0;">直接回覆本封郵件</strong>，填寫以下資訊預約領獎：
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                      <tr><td style="font-size:13px;color:rgba(242,217,208,0.75);line-height:2;padding-left:8px;">
                        ① 預計前來服務台領獎的<strong style="color:#f2d9d0;">日期與時間</strong><br />
                        ② 您的<strong style="color:#f2d9d0;">姓名</strong><br />
                        ③ 您的<strong style="color:#f2d9d0;">聯絡電話</strong>
                      </td></tr>
                    </table>
                    <p style="margin:0;font-size:12px;line-height:1.8;color:rgba(242,217,208,0.5);">
                      工作人員確認後將回覆您，屆時請攜帶本郵件並開啟埕花圖鑑頁面，供現場核驗。
                    </p>
                  </td>
                </tr>
              </table>

              <div style="height:18px;"></div>

              <!-- 活動規則 -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid rgba(242,217,208,0.08);padding-top:16px;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:rgba(242,217,208,0.4);letter-spacing:0.5px;">活動規則</p>
                    <ul style="margin:0;padding-left:16px;font-size:11px;line-height:1.9;color:rgba(242,217,208,0.35);">
                      <li>每位帳號限兌換一次，本活動好禮共 10 份，兌完為止</li>
                      <li>請於活動結束前完成預約並前來領取，<strong style="color:rgba(242,217,208,0.5);">逾期恕不補發</strong></li>
                      <li>領獎時需出示此封郵件及埕花圖鑑蒐集紀錄，缺一不可</li>
                      <li>本活動最終解釋權歸主辦方所有</li>
                    </ul>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 0 48px;">
              <p style="margin:0 0 4px;font-size:11px;color:rgba(242,217,208,0.22);letter-spacing:1px;">
                領獎請以回覆本信方式聯繫
              </p>
              <p style="margin:0;font-size:11px;color:rgba(242,217,208,0.18);letter-spacing:1px;">
                花轟 × 2026 鹽夏不夜埕 · 埕花
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    })

    await transporter.sendMail({
      from: `"埕花 花轟" <${GMAIL_USER}>`,
      to: email,
      subject: `🌸 恭喜！你是第 ${prizeRank} 位解鎖埕花隱藏成就的旅人`,
      html,
    })

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[send-completion-email]', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
