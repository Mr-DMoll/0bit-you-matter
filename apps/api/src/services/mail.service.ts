import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = `You Matter <${process.env.SENDER_EMAIL || "noreply@phoque-orbit.co.za"}>`;

async function send(payload: Parameters<typeof resend.emails.send>[0]) {
  const { data, error } = await resend.emails.send(payload);
  if (error) {
    console.error("❌ [MAIL] Resend error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
  console.log(`✅ [MAIL] Sent to ${Array.isArray(payload.to) ? payload.to.join(", ") : payload.to} (id: ${data?.id})`);
}

// ── Shared HTML shell ──────────────────────────────────────────────────────────

function emailShell(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You Matter</title>
</head>
<body style="margin:0;padding:0;background:#F0EFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EFFF;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="
                    background:#5B4FCF;
                    border-radius:14px;
                    width:44px;height:44px;
                    text-align:center;
                    vertical-align:middle;
                    font-size:18px;font-weight:800;
                    color:#ffffff;
                    letter-spacing:-0.5px;
                  ">YM</td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:20px;font-weight:800;color:#1A1535;letter-spacing:-0.5px;">You Matter</span>
                    <br/>
                    <span style="font-size:11px;color:#7A7499;letter-spacing:0.04em;">Career Guidance Platform</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="
              background:#ffffff;
              border-radius:20px;
              padding:40px 40px 36px;
              box-shadow:0 4px 24px rgba(91,79,207,0.08);
            ">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 0 8px;">
              <p style="font-size:12px;color:#7A7499;margin:0;line-height:1.7;">
                You Matter · Career Guidance Platform<br/>
                <a href="#" style="color:#5B4FCF;text-decoration:none;">Unsubscribe</a>
                &nbsp;·&nbsp;
                <a href="#" style="color:#5B4FCF;text-decoration:none;">Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Primary CTA button ─────────────────────────────────────────────────────────

function ctaButton(href: string, label: string) {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td style="
          background:#5B4FCF;
          border-radius:12px;
          padding:0;
        ">
          <a href="${href}" style="
            display:inline-block;
            padding:14px 32px;
            background:#5B4FCF;
            color:#ffffff;
            border-radius:12px;
            text-decoration:none;
            font-size:15px;
            font-weight:700;
            letter-spacing:-0.01em;
          ">${label}</a>
        </td>
      </tr>
    </table>`;
}

// ── Divider ────────────────────────────────────────────────────────────────────

const divider = `<hr style="border:none;border-top:1px solid #EEE9FF;margin:28px 0;" />`;

// ── Invite email ───────────────────────────────────────────────────────────────

export async function sendInviteEmail(to: string, inviteLink: string, name: string) {
  await send({
    from: FROM,
    to,
    subject: "You've been invited to You Matter",
    html: emailShell(`
      <h1 style="font-size:24px;font-weight:800;color:#1A1535;margin:0 0 8px;letter-spacing:-0.03em;">
        You're invited 🎉
      </h1>
      <p style="font-size:15px;color:#7A7499;margin:0 0 24px;line-height:1.6;">
        Hi ${name},
      </p>
      <p style="font-size:15px;color:#4B4775;margin:0;line-height:1.7;">
        You've been invited to join the <strong style="color:#1A1535;">You Matter</strong> platform —
        a career guidance tool helping South African learners discover the right
        path, bursaries, and institutions for their future.
      </p>

      <p style="font-size:15px;color:#4B4775;margin:16px 0 0;line-height:1.7;">
        Click the button below to set your password and activate your account.
      </p>

      ${ctaButton(inviteLink, "Accept Invitation")}

      ${divider}

      <p style="font-size:12px;color:#7A7499;margin:0;line-height:1.7;">
        This link expires in <strong>7 days</strong>.
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    `),
  });
}

// ── Password reset email ───────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  await send({
    from: FROM,
    to,
    subject: "Reset your You Matter password",
    html: emailShell(`
      <h1 style="font-size:24px;font-weight:800;color:#1A1535;margin:0 0 8px;letter-spacing:-0.03em;">
        Reset your password
      </h1>
      <p style="font-size:15px;color:#4B4775;margin:16px 0;line-height:1.7;">
        We received a request to reset the password for your You Matter account.
        Click the button below to choose a new password.
      </p>

      ${ctaButton(resetLink, "Reset Password")}

      ${divider}

      <p style="font-size:12px;color:#7A7499;margin:0;line-height:1.7;">
        This link expires in <strong>1 hour</strong>.
        If you didn't request a password reset, you can safely ignore this email —
        your password will not be changed.
      </p>
    `),
  });
}

// ── Verification email ─────────────────────────────────────────────────────────

export async function sendVerificationEmail(to: string, verifyLink: string) {
  await send({
    from: FROM,
    to,
    subject: "Verify your You Matter account",
    html: emailShell(`
      <h1 style="font-size:24px;font-weight:800;color:#1A1535;margin:0 0 8px;letter-spacing:-0.03em;">
        Verify your email
      </h1>
      <p style="font-size:15px;color:#4B4775;margin:16px 0;line-height:1.7;">
        One last step — please verify your email address to activate your You Matter account.
      </p>

      ${ctaButton(verifyLink, "Verify Email Address")}

      ${divider}

      <p style="font-size:12px;color:#7A7499;margin:0;line-height:1.7;">
        If you didn't create a You Matter account, you can safely ignore this email.
      </p>
    `),
  });
}

// ── Verification code email ────────────────────────────────────────────────────

export async function sendVerificationCodeEmail(to: string, code: string) {
  await send({
    from: FROM,
    to,
    subject: "Your You Matter verification code",
    html: emailShell(`
      <h1 style="font-size:24px;font-weight:800;color:#1A1535;margin:0 0 8px;letter-spacing:-0.03em;">
        Your verification code
      </h1>
      <p style="font-size:15px;color:#4B4775;margin:16px 0;line-height:1.7;">
        Use the code below to verify your identity. It expires in 15 minutes.
      </p>

      <div style="
        background:#F0EFFF;
        border:2px solid #EEE9FF;
        border-radius:14px;
        padding:28px;
        text-align:center;
        margin:24px 0;
      ">
        <span style="
          font-size:38px;
          font-weight:800;
          letter-spacing:12px;
          color:#5B4FCF;
        ">${code}</span>
      </div>

      ${divider}

      <p style="font-size:12px;color:#7A7499;margin:0;line-height:1.7;">
        This code expires in <strong>15 minutes</strong>.
        Never share this code with anyone.
      </p>
    `),
  });
}

// ── Review assignment email ────────────────────────────────────────────────────

export async function sendReviewAssignmentEmail(
  to: string,
  reviewerName: string,
  items: { title: string; type: string }[],
  reviewUrl: string,
) {
  const itemList = items.map((i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #EEE9FF;">
        <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9b8fd0;padding:1px 7px;background:#EEE9FF;border-radius:999px;margin-right:8px;">${i.type}</span>
        <span style="font-size:13px;color:#1A1535;">${i.title}</span>
      </td>
    </tr>
  `).join("");

  await send({
    from: FROM,
    to,
    subject: `You have ${items.length} new item${items.length !== 1 ? "s" : ""} to review on You Matter`,
    html: emailShell(`
      <h1 style="font-size:24px;font-weight:800;color:#1A1535;margin:0 0 8px;letter-spacing:-0.03em;">
        New content assigned to you
      </h1>
      <p style="font-size:15px;color:#7A7499;margin:0 0 20px;line-height:1.6;">
        Hi ${reviewerName},
      </p>
      <p style="font-size:15px;color:#4B4775;margin:0 0 20px;line-height:1.7;">
        You have been assigned <strong style="color:#1A1535;">${items.length} item${items.length !== 1 ? "s" : ""}</strong>
        to review on the You Matter platform. Please log in and verify or discard each item
        so learners can access accurate career information.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        ${itemList}
      </table>

      ${ctaButton(reviewUrl, "Open Review Queue")}

      ${divider}

      <p style="font-size:12px;color:#7A7499;margin:0;line-height:1.7;">
        You can view and manage your assigned reviews any time from your You Matter dashboard.
        If you believe this was assigned in error, please contact your administrator.
      </p>
    `),
  });
}
