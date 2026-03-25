import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendBookingConfirmationToUser(to: string, date: string, timeslot: string) {
  await resend.emails.send({
    from: 'Appointments <onboarding@resend.dev>',
    to,
    subject: 'Your appointment is confirmed',
    html: `
      <p>Hi,</p>
      <p>Your appointment has been confirmed for <strong>${date}</strong> at <strong>${timeslot}</strong>.</p>
      <p>If you need to cancel or reschedule, please contact us.</p>
    `,
  })
}

export async function sendBookingNotificationToOwner(
  to: string,
  userEmail: string,
  date: string,
  timeslot: string
) {
  await resend.emails.send({
    from: 'Appointments <onboarding@resend.dev>',
    to,
    subject: 'New appointment booked',
    html: `
      <p>A new appointment has been booked.</p>
      <p><strong>Customer:</strong> ${userEmail}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${timeslot}</p>
    `,
  })
}
