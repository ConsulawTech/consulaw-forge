import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM ?? "Consulaw Forge <noreply@consulawtech.com>";

function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (!resend) return { ok: false, reason: "no_api_key" };
  const plainText = text ?? htmlToText(html);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    text: plainText,
    replyTo: "support@consulawtech.com",
    headers: {
      "X-Mailer": "ConsulawForge",
      Precedence: "bulk",
      "List-Unsubscribe": "<mailto:unsubscribe@consulawtech.com>",
    },
  });
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function clientWelcomeEmail(opts: {
  clientName: string;
  email: string;
  tempPassword: string;
  portalUrl: string;
}) {
  const name = escapeHtml(opts.clientName);
  const email = escapeHtml(opts.email);
  const pass = escapeHtml(opts.tempPassword);
  const url = escapeHtml(opts.portalUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8faff;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;max-width:100%;">

        <tr>
          <td style="background:#1B3FEE;padding:32px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:rgba(255,255,255,0.15);border-radius:12px;padding:12px 20px;">
                  <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Consulaw Forge</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">Hi ${name},</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
              Your client portal is ready. Use the credentials below to log in and track your project progress, milestones, and messages from our team.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Your login credentials</p>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:5px 0;font-size:13px;color:#64748b;width:90px;">Email</td>
                      <td style="padding:5px 0;font-size:13px;font-weight:600;color:#0f172a;">${email}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;font-size:13px;color:#64748b;">Password</td>
                      <td style="padding:5px 0;font-size:14px;font-weight:700;color:#0f172a;font-family:monospace;letter-spacing:1px;">${pass}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#1B3FEE;border-radius:12px;padding:14px 36px;">
                  <a href="${url}" style="color:#fff;font-size:15px;font-weight:600;text-decoration:none;display:block;">
                    Open My Portal →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-align:center;">
              Or copy this link: <a href="${url}" style="color:#1B3FEE;word-break:break-all;">${url}</a>
            </p>
            <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:20px;">
              We recommend changing your password after your first login via Settings.<br/>
              Questions? Reply to this email.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f8faff;padding:20px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
              Consulaw Tech · © ${new Date().getFullYear()} All rights reserved
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
