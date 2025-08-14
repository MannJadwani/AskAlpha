import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS } from '../../../lib/plans';
import { SubscriptionService } from '../../../lib/subscription-service';

export async function GET(request: NextRequest) {
  try {
    // Initialize plans in database if they don't exist
    await SubscriptionService.initializePlans();
    
    // Return the predefined plans with full details
    return NextResponse.json({
      success: true,
      plans: SUBSCRIPTION_PLANS
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch plans' 
      },
      { status: 500 }
    );
  }
} 