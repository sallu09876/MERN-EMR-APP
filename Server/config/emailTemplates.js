const brand = `
  <div style="font-family: Arial, sans-serif; color:#0a1628">
    <div style="font-size:18px; font-weight:700; margin-bottom:10px;">MedFlow Hospital</div>
    <div style="font-size:12px; color:#6b7280; margin-bottom:18px;">Clinical care, beautifully managed.</div>
  </div>
`;

export const otpTemplate = (otp, purpose) => {
  const title =
    purpose === "SIGNUP"
      ? "Verify your MedFlow account"
      : purpose === "FORGOT_PASSWORD"
        ? "Reset your MedFlow password"
        : "Security verification";

  return `
    ${brand}
    <div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#0a1628">
      <p style="margin:0 0 10px;">${title}</p>
      <div style="font-size:28px; letter-spacing:4px; font-weight:800; margin:16px 0;">
        ${otp}
      </div>
      <p style="margin:0 0 12px; color:#374151;">This code expires in 10 minutes.</p>
      <p style="margin:0; color:#6b7280;">If you didn’t request this, you can ignore this email.</p>
    </div>
  `;
};

export const welcomeTemplate = (name) => `
  ${brand}
  <div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#0a1628">
    <p style="margin:0 0 10px;">Welcome to MedFlow, <b>${name}</b>!</p>
    <p style="margin:0; color:#374151;">Your email is verified. You can now log in to book appointments.</p>
  </div>
`;

export const loginAlertTemplate = (name, time) => `
  ${brand}
  <div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#0a1628">
    <p style="margin:0 0 10px;">Hi <b>${name}</b>,</p>
    <p style="margin:0 0 12px; color:#374151;">We detected a login on <b>${time}</b>.</p>
    <p style="margin:0; color:#6b7280;">If this wasn’t you, please reset your password immediately.</p>
  </div>
`;

export const appointmentConfirmTemplate = (name, doctorName, date, time) => `
  ${brand}
  <div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#0a1628">
    <p style="margin:0 0 10px;">Hi <b>${name}</b>, your appointment is confirmed.</p>
    <p style="margin:0 0 8px; color:#374151;">Doctor: <b>${doctorName}</b></p>
    <p style="margin:0 0 8px; color:#374151;">When: <b>${date}</b> at <b>${time}</b></p>
    <p style="margin:0; color:#6b7280;">Please arrive 10 minutes early.</p>
  </div>
`;

export const appointmentCancelTemplate = (name, doctorName, date, time) => `
  ${brand}
  <div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#0a1628">
    <p style="margin:0 0 10px;">Hi <b>${name}</b>, your appointment was cancelled.</p>
    <p style="margin:0 0 8px; color:#374151;">Doctor: <b>${doctorName}</b></p>
    <p style="margin:0; color:#374151;">When: <b>${date}</b> at <b>${time}</b></p>
  </div>
`;

export const passwordChangedTemplate = (name) => `
  ${brand}
  <div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#0a1628">
    <p style="margin:0 0 10px;">Hi <b>${name}</b>,</p>
    <p style="margin:0; color:#374151;">Your password was changed successfully. If you didn’t do this, contact support immediately.</p>
  </div>
`;

