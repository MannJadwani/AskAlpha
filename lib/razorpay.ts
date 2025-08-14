// lib/razorpay.ts
import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,     // from Razorpay dashboard
  key_secret: process.env.RAZORPAY_SECRET!, // from Razorpay dashboard
});
