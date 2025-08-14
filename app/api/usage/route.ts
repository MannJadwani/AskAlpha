// app/api/usage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { trackUsage } from '@/lib/usageTracker';

export async function POST(request: NextRequest) {
  const { planId, userId, email, planName } = await request.json();

  if (!planId || !userId || !email || !planName) {
    return NextResponse.json({ error: 'Missing required fields' });
  }

  const result = await trackUsage({ planId, userId, email, planName });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
