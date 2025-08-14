import { NextRequest, NextResponse } from "next/server";
import { razorpay } from '@/lib/razorpay';


export const POST = async(request:NextRequest)=>{
    try {
        const {subscriptionid} = await request.json();
        const subscription = await razorpay.subscriptions.cancel(subscriptionid);
        return NextResponse.json({success:true,subscriptionid,subscription})
    } catch (error) {
        console.error('Error in subscription cancellation:', error);
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }
}