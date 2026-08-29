export interface EmailTemplateOptions {
  supportUrl?: string
  privacyUrl?: string
  termsUrl?: string
}

function getUrls(options?: EmailTemplateOptions) {
  return {
    supportUrl: options?.supportUrl || process.env['SUPPORT_URL'] || 'https://premiumpc.com/support',
    privacyUrl: options?.privacyUrl || process.env['PRIVACY_URL'] || 'https://premiumpc.com/privacy',
    termsUrl: options?.termsUrl || process.env['TERMS_URL'] || 'https://premiumpc.com/terms',
  }
}

/**
 * LIGHT THEME Email Verification Template
 * Bright, high-contrast, clean aesthetic with white card, rich navy headers, and electric blue accents.
 */
export function renderLightVerificationEmail(code: string, options?: EmailTemplateOptions): string {
  const { supportUrl, privacyUrl, termsUrl } = getUrls(options)
  const currentYear = new Date().getFullYear()

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Your PREMIUM PC Verification Code</title>
  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding-left: 10px !important; padding-right: 10px !important; }
      .content-box { padding: 24px 18px !important; }
      .otp-code { font-size: 32px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <!-- Wrapper Table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f1f5f9; padding: 24px 0;">
    <tr>
      <td align="center">
        <!--[if mso]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #cbd5e1; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%); padding: 28px 24px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center">
                    <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      ⚡ PREMIUM PC
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="content-box" style="padding: 36px 32px 32px 32px;">
              
              <!-- Security Emblem Visual (Universal Email Compatible) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; width: 68px; height: 68px; border-radius: 50%; background-color: #eff6ff; border: 2px solid #bfdbfe; text-align: center; line-height: 68px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);">
                      <span style="font-size: 32px; line-height: 68px; vertical-align: middle;">🛡️</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Greeting & Heading -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                      Your verification code
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 15px; color: #334155; line-height: 1.5;">
                      Use the code below to verify your email address and complete your login to <strong>PREMIUM PC</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Verification Code Focal Display Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="background-color: #f0f6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 22px 16px;">
                    <span class="otp-code" style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Monaco, Courier, monospace; font-size: 38px; font-weight: 800; color: #1d4ed8; letter-spacing: 12px; display: inline-block; margin-left: 12px;">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiry Note -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 20px; padding: 8px 18px; font-size: 13px; font-weight: 600; color: #334155;">
                      ⏱️ Your code expires in <span style="color: #2563eb; font-weight: 700;">5 minutes</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Request Notice -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
                      If you did not request this code, you can safely ignore this email. Someone may have typed your email address by mistake.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Reminder Alert Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #fffbe6; border: 1px solid #ffe58f; border-radius: 10px; padding: 14px 16px; margin-bottom: 28px;">
                <tr>
                  <td width="28" valign="top" style="padding-right: 10px;">
                    <span style="font-size: 18px;">🔒</span>
                  </td>
                  <td>
                    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #722ed1; line-height: 1.4;">
                      Security Reminder: <span style="font-weight: 400; color: #595959;">Never share this code with anyone. PREMIUM PC staff will never ask for your code over phone, email, or chat.</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 14px; color: #64748b;">Thanks,</p>
                    <p style="margin: 0; font-size: 15px; font-weight: 700; color: #2563eb;">PREMIUM PC Team</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #475569;">
                <a href="${supportUrl}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 600;">Support Contact</a> &nbsp;|&nbsp;
                <a href="${privacyUrl}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 600;">Privacy Policy</a> &nbsp;|&nbsp;
                <a href="${termsUrl}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 600;">Terms &amp; Conditions</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                &copy; ${currentYear} PREMIUM PC. High-Performance Hardware &amp; Custom Rigs. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * DARK THEME Email Verification Template
 * Sleek navy aesthetic with high-contrast bright white text, electric blue accents, and readable elements.
 */
export function renderDarkVerificationEmail(code: string, options?: EmailTemplateOptions): string {
  const { supportUrl, privacyUrl, termsUrl } = getUrls(options)
  const currentYear = new Date().getFullYear()

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Your PREMIUM PC Verification Code</title>
  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding-left: 10px !important; padding-right: 10px !important; }
      .content-box { padding: 24px 18px !important; }
      .otp-code { font-size: 32px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f8fafc;">
  <!-- Wrapper Table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #0b0f19; padding: 24px 0;">
    <tr>
      <td align="center">
        <!--[if mso]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #151c2c; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 0 40px rgba(59, 130, 246, 0.25); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e293b 100%); border-bottom: 1px solid #334155; padding: 28px 24px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center">
                    <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      ⚡ PREMIUM PC
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="content-box" style="padding: 36px 32px 32px 32px;">
              
              <!-- Security Emblem Visual (Universal Email Compatible) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; width: 68px; height: 68px; border-radius: 50%; background-color: #1e293b; border: 2px solid #3b82f6; text-align: center; line-height: 68px; box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);">
                      <span style="font-size: 32px; line-height: 68px; vertical-align: middle;">🛡️</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Greeting & Heading -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">
                      Your verification code
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 15px; color: #cbd5e1; line-height: 1.5;">
                      Use the code below to verify your email address and complete your login to <strong>PREMIUM PC</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Verification Code Focal Display Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="background-color: #0f172a; border: 2px solid #3b82f6; border-radius: 12px; padding: 22px 16px; box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.2);">
                    <span class="otp-code" style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Monaco, Courier, monospace; font-size: 38px; font-weight: 800; color: #60a5fa; letter-spacing: 12px; display: inline-block; margin-left: 12px; text-shadow: 0 0 12px rgba(96, 165, 250, 0.6);">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiry Note -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #1e293b; border: 1px solid #475569; border-radius: 20px; padding: 8px 18px; font-size: 13px; font-weight: 600; color: #f8fafc;">
                      ⏱️ Your code expires in <span style="color: #60a5fa; font-weight: 700;">5 minutes</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Request Notice -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                      If you did not request this code, you can safely ignore this email. Someone may have typed your email address by mistake.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Reminder Alert Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #1e293b; border: 1px solid #3b82f6; border-radius: 10px; padding: 14px 16px; margin-bottom: 28px;">
                <tr>
                  <td width="28" valign="top" style="padding-right: 10px;">
                    <span style="font-size: 18px;">🔒</span>
                  </td>
                  <td>
                    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #60a5fa; line-height: 1.4;">
                      Security Reminder: <span style="font-weight: 400; color: #e2e8f0;">Never share this code with anyone. PREMIUM PC staff will never ask for your code over phone, email, or chat.</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td style="border-top: 1px solid #334155; padding-top: 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 14px; color: #94a3b8;">Thanks,</p>
                    <p style="margin: 0; font-size: 15px; font-weight: 700; color: #60a5fa;">PREMIUM PC Team</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color: #0f172a; border-top: 1px solid #334155; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #cbd5e1;">
                <a href="${supportUrl}" target="_blank" style="color: #60a5fa; text-decoration: underline; font-weight: 600;">Support Contact</a> &nbsp;|&nbsp;
                <a href="${privacyUrl}" target="_blank" style="color: #60a5fa; text-decoration: underline; font-weight: 600;">Privacy Policy</a> &nbsp;|&nbsp;
                <a href="${termsUrl}" target="_blank" style="color: #60a5fa; text-decoration: underline; font-weight: 600;">Terms &amp; Conditions</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${currentYear} PREMIUM PC. High-Performance Hardware &amp; Custom Rigs. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`
}
