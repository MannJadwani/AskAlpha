import crypto from 'crypto';
import { NextRequest, NextResponse } from "next/server";
import { razorpay } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = await request.json();

  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET!)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest('hex');

  if (generated === razorpay_signature) {
    // success: update DB
    return NextResponse.json({ success: true, message: 'Signature verified successfully' }, { status: 200 });
  } else {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
}
