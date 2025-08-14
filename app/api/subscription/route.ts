import { NextRequest, NextResponse } from "next/server";
import { razorpay } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    const { planId, customerEmail } = await request.json();

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
      quantity: 1,
      start_at: Math.floor(Date.now() / 1000) + 3600, // starts 1 hour from now
      notes: {
        email: customerEmail,
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      subscription,
    })
  } catch (err) {
    console.error('Subscription creation failed:', err);
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  }
}

export const GET = async (request: NextRequest) => {

    const plans = await razorpay.plans.all();
    return NextResponse.json({
        success: true,
        message: "Subscription plans fetched!",
        data: plans,
    });
};