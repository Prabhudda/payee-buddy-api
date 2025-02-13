// import twilioClient from "../config/twilio.js";

// export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// export const sendOTPWhatsApp = async (phoneNumber, otp) => {
//   await twilioClient.messages.create({
//     from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
//     to: `whatsapp:${phoneNumber}`,
//     body: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
//   });
// };


import twilioClient from "../config/twilio.js";

export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTPWhatsApp = async (phoneNumber, otp) => {
  try {
    const message = await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phoneNumber}`,
      body: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));
    const updatedMessage = await twilioClient.messages(message.sid).fetch();

    const isSuccess = ["sent", "delivered"].includes(updatedMessage.status);

    return { 
      success: isSuccess, 
      message: isSuccess ? "OTP sent successfully" : "failed to send OTP. Please try again" 
    };

  } catch (error) {
    return { success: false, message: "failed to send OTP. Please try again", error: error.message };
  }
};
