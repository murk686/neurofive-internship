const nodemailer = require('nodemailer');

/**
 * Transport-agnostic email sending. In development/test, emails are logged
 * to the console (and captured in `sentEmails` for test assertions) instead
 * of actually being sent - no real SMTP network access is required to run
 * this project locally or in CI. In production, set SMTP_* env vars and
 * real emails go out via nodemailer.
 */
const sentEmails = []; // in-memory log, useful for tests/demos

function buildTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return null; // no SMTP configured -> log-only mode
}

const transport = buildTransport();

async function sendEmail({ to, subject, text, html }) {
  const message = {
    from: process.env.EMAIL_FROM || 'Event Booking <no-reply@eventbooking.local>',
    to,
    subject,
    text,
    html: html || `<p>${text}</p>`,
  };

  if (!transport) {
    // Dev/test mode: no SMTP configured, just log + record it.
    console.log(`[email:mock] to=${to} subject="${subject}"`);
    sentEmails.push({ ...message, sentAt: new Date().toISOString() });
    return { mocked: true };
  }

  const info = await transport.sendMail(message);
  sentEmails.push({ ...message, sentAt: new Date().toISOString(), messageId: info.messageId });
  return { mocked: false, messageId: info.messageId };
}

const templates = {
  bookingConfirmed: (booking, event) => ({
    subject: `You're in! Booking confirmed for ${event.title}`,
    text: `Your booking for ${booking.seats} seat(s) at "${event.title}" on ${new Date(
      event.startTime
    ).toLocaleString()} is confirmed. Total paid: ${booking.totalPrice}.`,
  }),
  bookingCancelled: (booking, event) => ({
    subject: `Booking cancelled: ${event.title}`,
    text: `Your booking for ${booking.seats} seat(s) at "${event.title}" has been cancelled and any held seats were released.`,
  }),
  waitlistPromoted: (booking, event) => ({
    subject: `A seat opened up! You're booked for ${event.title}`,
    text: `Good news - a seat became available and you've been automatically booked for "${event.title}" (${booking.seats} seat(s)). Total: ${booking.totalPrice}.`,
  }),
  paymentExpired: (event) => ({
    subject: `Your hold on ${event.title} has expired`,
    text: `We didn't receive payment in time, so your seat hold for "${event.title}" was released back to availability.`,
  }),
};

module.exports = { sendEmail, templates, sentEmails };
