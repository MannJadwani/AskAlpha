import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { plan, frequency, date, userId } = await request.json();

    const parsedDate = new Date(date);
    const nextMonthDate = new Date(parsedDate);
    nextMonthDate.setMonth(parsedDate.getMonth() + 1);
    const nextYearDate = new Date(parsedDate);
    nextYearDate.setFullYear(parsedDate.getFullYear() + 1);

    const { data, error } = await supabase
      .from('plan_details')
      .insert([
        {
          plan,
          frequency: plan === 'Free' ? 5 : Number(frequency),
          date: plan === 'Free' ? nextYearDate.toISOString() : parsedDate.toISOString(),
          userId: Number(userId),
          monthenddate: plan === 'Free' ? nextYearDate.toISOString() : nextMonthDate.toISOString(),
          subscriptionid: '',
        },
      ])
      .select()
      .single();


    if (error) {
      console.error('Error inserting plan_details:', error);
      return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      planData: {
        ...data,
        id: data.id?.toString(),
        userId: data.userId?.toString(),
        frequency: data.frequency?.toString(),
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
