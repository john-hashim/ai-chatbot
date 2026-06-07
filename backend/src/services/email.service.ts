import { Resend } from 'resend'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const resend = new Resend(process.env.RESEND_API_KEY)

// Resend's shared `onboarding@resend.dev` only delivers to the Resend account
// owner — every other recipient is silently dropped. Set EMAIL_FROM
// (e.g. "Chatvio <noreply@mail.chatvio.io>") once a domain is verified in
// Resend → Domains so all recipients (booking + signup verification) receive mail.
// Falls back to the legacy BOOKING_EMAIL_FROM name for backward compatibility.
const FROM_ADDRESS =
  process.env.EMAIL_FROM || process.env.BOOKING_EMAIL_FROM || 'Chatvio <onboarding@resend.dev>'
const USING_SANDBOX_SENDER = FROM_ADDRESS.includes('onboarding@resend.dev')

// Inline SVG matches the frontend logo (frontend/public/favicon.svg). Gmail
// strips inline <svg>; the "Chatvio" wordmark beside it preserves the brand
// when the mark is removed.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="52 62 96 46" width="56" height="28" style="vertical-align:middle">
  <defs>
    <linearGradient id="pc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF584A" stop-opacity="1" />
      <stop offset="100%" stop-color="#FF7E73" stop-opacity="1" />
    </linearGradient>
  </defs>
  <path d="M 60 100 Q 80 70, 100 100 T 140 100" stroke="url(#pc-grad)" stroke-width="16" stroke-linecap="round" fill="none" />
  <circle cx="140" cy="100" r="8" fill="#FF584A" />
</svg>`

type BookingEmailFields = {
  eventType: string
  inviteeName: string
  inviteeEmail: string
  date: string
  timeslot: string
  timezone: string
  location?: string
}

function getTimezoneLongName(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'long',
    }).formatToParts(new Date())
    return parts.find(p => p.type === 'timeZoneName')?.value ?? tz
  } catch {
    return tz
  }
}

function formatEventDateTime(date: string, time: string, tz: string): string {
  try {
    const dt = dayjs.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', tz)
    if (!dt.isValid()) return `${time} ${date}`
    const prettyTime = dt.format('hh:mma')
    const prettyDate = dt.format('dddd, D MMMM YYYY')
    return `${prettyTime} - ${prettyDate} (${getTimezoneLongName(tz)})`
  } catch {
    return `${time} ${date}`
  }
}

function fieldBlock(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:14px 0 0 0;">
        <div style="color:#6b7280;font-size:13px;font-weight:600;letter-spacing:0.02em;text-transform:none;margin-bottom:4px;">${label}</div>
        <div style="color:#111827;font-size:15px;line-height:1.5;">${value || '&nbsp;'}</div>
      </td>
    </tr>`
}

function buildEmail(opts: {
  greeting: string
  intro: string
  fields: BookingEmailFields
}): string {
  const { greeting, intro, fields } = opts
  const dateTime = formatEventDateTime(fields.date, fields.timeslot, fields.timezone)
  const tzLong = getTimezoneLongName(fields.timezone)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Chatvio</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #f3f4f6;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:8px;">${LOGO_SVG}</td>
                  <td style="vertical-align:middle;font-size:18px;font-weight:600;color:#111827;letter-spacing:-0.01em;">Chatvio</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px 0;font-size:16px;color:#111827;">${greeting}</p>
              <p style="margin:0 0 8px 0;font-size:15px;color:#374151;line-height:1.5;">${intro}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
                ${fieldBlock('Event Type', fields.eventType)}
                ${fieldBlock('Invitee', fields.inviteeName)}
                ${fieldBlock('Invitee Email', fields.inviteeEmail)}
                ${fieldBlock('Event Date/Time', dateTime)}
                ${fieldBlock('Location', fields.location ?? '')}
                ${fieldBlock('Invitee Time Zone', tzLong)}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                This is an automated message from Chatvio. If you need to cancel or reschedule, please contact the host.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildVerificationEmail(verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Chatvio</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #f3f4f6;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:8px;">${LOGO_SVG}</td>
                  <td style="vertical-align:middle;font-size:18px;font-weight:600;color:#111827;letter-spacing:-0.01em;">Chatvio</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px 0;font-size:20px;font-weight:600;color:#111827;">You're in. Let's build something brilliant.</p>
              <p style="margin:0 0 16px 0;font-size:15px;color:#374151;line-height:1.6;">
                Thanks for joining Chatvio, your new favorite way to build, train, and deploy powerful AI Agents. You're just one step away from going live.
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.6;">
                Click below to confirm your email and unlock your workspace.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:8px;background-color:#000000;">
                    <a href="${verifyUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Confirm Sign Up</a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0 0;font-size:15px;color:#374151;">Thank you,<br>Chatvio Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildPasswordResetEmail(resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Chatvio</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #f3f4f6;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:8px;">${LOGO_SVG}</td>
                  <td style="vertical-align:middle;font-size:18px;font-weight:600;color:#111827;letter-spacing:-0.01em;">Chatvio</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px 0;font-size:20px;font-weight:600;color:#111827;">Reset your password</p>
              <p style="margin:0 0 16px 0;font-size:15px;color:#374151;line-height:1.6;">
                We received a request to reset the password for your Chatvio account. Click the button below to choose a new password.
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.6;">
                This link expires in 15 minutes. If you didn't request a password reset, you can safely ignore this email — your password won't change.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:8px;background-color:#000000;">
                    <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0 0;font-size:15px;color:#374151;">Thank you,<br>Chatvio Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Confirm your email for Chatvio',
    html: buildVerificationEmail(verifyUrl),
  })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Reset your Chatvio password',
    html: buildPasswordResetEmail(resetUrl),
  })
}

export async function sendBookingConfirmationToUser(opts: BookingEmailFields) {
  if (USING_SANDBOX_SENDER) {
    console.warn(
      `[email] Skipping invitee confirmation to ${opts.inviteeEmail}: ` +
        `BOOKING_EMAIL_FROM is unset and Resend's sandbox sender cannot deliver to arbitrary recipients. ` +
        `Verify a domain in Resend and set BOOKING_EMAIL_FROM to enable invitee emails.`
    )
    return
  }
  const html = buildEmail({
    greeting: `Hi ${opts.inviteeName},`,
    intro: 'Your event has been scheduled.',
    fields: opts,
  })
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.inviteeEmail,
    subject: `New event scheduled: ${opts.eventType}`,
    html,
  })
}

export async function sendBookingNotificationToOwner(
  to: string,
  ownerName: string | null,
  fields: BookingEmailFields
) {
  const html = buildEmail({
    greeting: `Hi${ownerName ? ` ${ownerName}` : ''},`,
    intro: 'A new event has been scheduled.',
    fields,
  })
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `New event scheduled: ${fields.eventType}`,
    html,
  })
}
