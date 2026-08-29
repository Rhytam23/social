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
 * Clean, bright aesthetic with white background, soft slate text, and electric blue accents.
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
      .email-container { width: 100% !important; padding-left: 12px !important; padding-right: 12px !important; }
      .content-box { padding: 24px 18px !important; }
      .otp-code { font-size: 32px !important; letter-spacing: 8px !important; padding: 16px 8px !important; }
    }
    @keyframes shieldPulseLight {
      0% { transform: scale(1); filter: drop-shadow(0 4px 12px rgba(37, 99, 235, 0.2)); }
      50% { transform: scale(1.05); filter: drop-shadow(0 6px 18px rgba(37, 99, 235, 0.35)); }
      100% { transform: scale(1); filter: drop-shadow(0 4px 12px rgba(37, 99, 235, 0.2)); }
    }
    .animated-shield { animation: shieldPulseLight 3s ease-in-out infinite; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <!-- Wrapper Table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f4f6fb; padding: 30px 0;">
    <tr>
      <td align="center">
        <!--[if mso]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(37, 99, 235, 0.06); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%); padding: 28px 36px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center">
                    <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 1.5px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      ⚡ PREMIUM PC
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="content-box" style="padding: 36px 36px 32px 36px;">
              
              <!-- Security Emblem Visual -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div class="animated-shield" style="display: inline-block; width: 64px; height: 64px; border-radius: 50%; background-color: #eff6ff; border: 2px solid #bfdbfe; text-align: center; line-height: 64px;">
                      <!-- Inline Shield SVG with fallbacks -->
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-top: 14px;">
                        <path d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2Z" fill="#2563eb" opacity="0.15"/>
                        <path d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2Z" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9 12L11 14L15 10" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Greeting & Heading -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">
                      Your verification code
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.5;">
                      Use the code below to verify your email address and continue with your PREMIUM PC account.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Verification Code Focal Display Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="background-color: #f0f6ff; border: 2px dashed #bfdbfe; border-radius: 12px; padding: 22px 16px;">
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
                    <div style="display: inline-block; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 8px 18px; font-size: 13px; font-weight: 600; color: #475569;">
                      ⏱️ Your code expires in <span style="color: #2563eb; font-weight: 700;">5 minutes</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Request Notice -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                      If you did not request this code, you can safely ignore this email. Someone may have typed your address by mistake.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Reminder Alert Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 14px 16px; margin-bottom: 28px;">
                <tr>
                  <td width="28" valign="top" style="padding-right: 10px;">
                    <span style="font-size: 16px;">🔒</span>
                  </td>
                  <td>
                    <p style="margin: 0; font-size: 13px; font-weight: 600; color: #854d0e; line-height: 1.4;">
                      Security Reminder: <span style="font-weight: 400; color: #a16207;">Never share this code with anyone. PREMIUM PC staff will never ask for your code over phone, email, or chat.</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 14px; color: #64748b;">Thanks,</p>
                    <p style="margin: 0; font-size: 15px; font-weight: 700; color: #2563eb;">PREMIUM PC Team</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 36px; text-align: center;">
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #64748b;">
                <a href="${supportUrl}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">Support Contact</a> &nbsp;|&nbsp;
                <a href="${privacyUrl}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">Privacy Policy</a> &nbsp;|&nbsp;
                <a href="${termsUrl}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">Terms &amp; Conditions</a>
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

/**
 * DARK THEME Email Verification Template
 * Deep navy background, glowing electric blue highlights, and sleek gaming aesthetic.
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
      .email-container { width: 100% !important; padding-left: 12px !important; padding-right: 12px !important; }
      .content-box { padding: 24px 18px !important; }
      .otp-code { font-size: 32px !important; letter-spacing: 8px !important; padding: 16px 8px !important; }
    }
    @keyframes shieldGlowDark {
      0% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.4)); }
      50% { transform: scale(1.05); filter: drop-shadow(0 0 22px rgba(59, 130, 246, 0.7)); }
      100% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.4)); }
    }
    .animated-shield { animation: shieldGlowDark 3s ease-in-out infinite; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #e2e8f0;">
  <!-- Wrapper Table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #090d16; padding: 30px 0;">
    <tr>
      <td align="center">
        <!--[if mso]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #111726; border-radius: 16px; border: 1px solid #1e293b; box-shadow: 0 0 35px rgba(37, 99, 235, 0.18); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e293b 100%); border-b: 1px solid #1e293b; padding: 28px 36px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center">
                    <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 1.5px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-shadow: 0 0 12px rgba(59, 130, 246, 0.5);">
                      ⚡ PREMIUM PC
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="content-box" style="padding: 36px 36px 32px 36px;">
              
              <!-- Security Emblem Visual -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div class="animated-shield" style="display: inline-block; width: 64px; height: 64px; border-radius: 50%; background-color: #1a2336; border: 2px solid #3b82f6; text-align: center; line-height: 64px; box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);">
                      <!-- Inline Shield SVG with fallbacks -->
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-top: 14px;">
                        <path d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2Z" fill="#3b82f6" opacity="0.2"/>
                        <path d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2Z" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9 12L11 14L15 10" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Greeting & Heading -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                      Your verification code
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 15px; color: #94a3b8; line-height: 1.5;">
                      Use the code below to verify your email address and continue with your PREMIUM PC account.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Verification Code Focal Display Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="background: linear-gradient(180deg, #182235 0%, #0f172a 100%); border: 1px solid #3b82f6; border-radius: 12px; padding: 22px 16px; box-shadow: inset 0 0 15px rgba(59, 130, 246, 0.15), 0 0 20px rgba(59, 130, 246, 0.1);">
                    <span class="otp-code" style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Monaco, Courier, monospace; font-size: 38px; font-weight: 800; color: #60a5fa; letter-spacing: 12px; display: inline-block; margin-left: 12px; text-shadow: 0 0 10px rgba(96, 165, 250, 0.4);">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiry Note -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 8px 18px; font-size: 13px; font-weight: 600; color: #cbd5e1;">
                      ⏱️ Your code expires in <span style="color: #60a5fa; font-weight: 700;">5 minutes</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Request Notice -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                      If you did not request this code, you can safely ignore this email. Someone may have typed your address by mistake.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Reminder Alert Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #162032; border: 1px solid #1e3a8a; border-radius: 10px; padding: 14px 16px; margin-bottom: 28px;">
                <tr>
                  <td width="28" valign="top" style="padding-right: 10px;">
                    <span style="font-size: 16px;">🔒</span>
                  </td>
                  <td>
                    <p style="margin: 0; font-size: 13px; font-weight: 600; color: #93c5fd; line-height: 1.4;">
                      Security Reminder: <span style="font-weight: 400; color: #cbd5e1;">Never share this code with anyone. PREMIUM PC staff will never ask for your code over phone, email, or chat.</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td style="border-top: 1px solid #1e293b; padding-top: 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 14px; color: #64748b;">Thanks,</p>
                    <p style="margin: 0; font-size: 15px; font-weight: 700; color: #60a5fa;">PREMIUM PC Team</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color: #0c101a; border-top: 1px solid #1e293b; padding: 24px 36px; text-align: center;">
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #64748b;">
                <a href="${supportUrl}" target="_blank" style="color: #60a5fa; text-decoration: none; font-weight: 500;">Support Contact</a> &nbsp;|&nbsp;
                <a href="${privacyUrl}" target="_blank" style="color: #60a5fa; text-decoration: none; font-weight: 500;">Privacy Policy</a> &nbsp;|&nbsp;
                <a href="${termsUrl}" target="_blank" style="color: #60a5fa; text-decoration: none; font-weight: 500;">Terms &amp; Conditions</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
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
