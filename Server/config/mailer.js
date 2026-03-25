import nodemailer from "nodemailer";

const buildTransporter = () => {
  // IMPORTANT: build lazily so dotenv has already populated process.env
  // by the time we create the transporter.
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendMail = async ({ to, subject, html }) => {
  // In local/dev environments without email env vars, fail "soft" so
  // the rest of the auth flow can still be tested.
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    // eslint-disable-next-line no-console
    console.log(`[Mail disabled] to=${to} subject=${subject}\n${html}`);
    return;
  }

  try {
    const transporter = buildTransporter();
    await transporter.sendMail({
      from: `"MedFlow Hospital" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    // Fail soft in dev so signup/forgot-password flows still work locally.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`[Mail failed - dev fallback] to=${to} subject=${subject} error=${err?.message}\n${html}`);
      return;
    }
    throw err;
  }
};

