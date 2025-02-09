import twilioClient from "../config/twilio.js";

export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTPWhatsApp = async (phoneNumber, otp) => {
  console.log(phoneNumber)
  await twilioClient.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${phoneNumber}`,
    body: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
  });
};
