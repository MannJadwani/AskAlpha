import { NextRequest, NextResponse } from "next/server";
import { razorpay } from '@/lib/razorpay';

export async function GET(
    _request: NextRequest,
    context: { params: any }
) {
    try {
        const { id } = await context.params as { id: string };


        const subscription = await razorpay.subscriptions.fetch(id);


        return NextResponse.json({ success: true, subscription });
    } catch (error) {
        console.error('Error fetching plan by userId:', error);
        return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 });
    }
}