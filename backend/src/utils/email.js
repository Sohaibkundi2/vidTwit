import nodemailer from 'nodemailer'

let transporter

const getTransporter = () => {
  if (transporter) {
    return transporter
  }

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service is not configured')
  }

  const port = Number(process.env.EMAIL_PORT) || 587

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  return transporter
}

const sendEmail = async ({ to, subject, text, html }) => {
  const emailTransporter = getTransporter()

  await emailTransporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  })
}

const sendRegistrationOtpEmail = async ({ email, fullName, otp, expiresInMinutes }) => {
  const recipientName = fullName || 'there'
  const subject = 'Verify your VidTwit account'
  const text = `Hi ${recipientName}, your VidTwit verification code is ${otp}. It expires in ${expiresInMinutes} minutes.`
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 8px;">Verify your VidTwit account</h2>
      <p>Hi ${recipientName},</p>
      <p>Use the OTP below to finish creating your account:</p>
      <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">${otp}</div>
      <p>This code expires in ${expiresInMinutes} minutes.</p>
      <p>If you did not create this account, you can ignore this email.</p>
    </div>
  `

  await sendEmail({
    to: email,
    subject,
    text,
    html,
  })
}

export { sendRegistrationOtpEmail }