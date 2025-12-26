
import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { trackUsage } from '@/lib/usageTracker';


// Update plan_details by ID
export async function POST(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const { id } = await context.params as { id: string };
    const { name, monthly_limit, subscriptionID, MonthEndDate } = await request.json();

    const currentDate = new Date();
    // const nextMonthDate = new Date(currentDate);
    // nextMonthDate.setMonth(currentDate.getMonth() + 1);
    const nextYearDate = new Date(currentDate);
    nextYearDate.setFullYear(currentDate.getFullYear() + 1);

    const { data, error } = await supabase
      .from('plan_details')
      .update({
        plan: name,
        // Do not reset Free plan credits on every update; always use provided value
        frequency: Number(monthly_limit),
        // Keep date as the time of update
        date: currentDate.toISOString(),
        // Respect provided MonthEndDate when decrementing credits
        monthenddate: MonthEndDate,
        // Free plan should not have a subscription id
        subscriptionid: name === 'Free' ? '' : subscriptionID,
      })
      .eq('id', Number(id))
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating plan_details:', error);
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      plan: {
        ...data,
        id: data.id.toString(),
        userId: data.userId.toString(),
        frequency: data.frequency?.toString() ?? null,
        monthenddate: data.monthenddate,
      },
    });
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// Get plan_details by userId
export async function GET(
  _request: NextRequest,
  context: { params: any }
) {
  try {
    const { id } = await context.params as { id: string };

    const { data, error } = await supabase
      .from('plan_details')
      .select('*, user:app_user(*)') // assuming FK relationship is defined with user
      .eq('userId', Number(id))
      .single();

    console.log('specific plan data',data);

    const serializedPlan = {
      ...data,
      id: data.id.toString(),
      userId: data.userId.toString(),
      frequency: data.frequency?.toString() ?? null,
      user: {
        ...data.user,
        id: data.user?.id?.toString(),
      },
    };
    

    if (error || !data) {
      console.error('Error fetching plan:', error);
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    // let currentDate = new Date();
    // const nextMonthDate = new Date(currentDate);
    // nextMonthDate.setMonth(currentDate.getMonth() + 1);
    // let renewFre=0;
    // if(data.plan == 'Basic'){renewFre=50}
    // if(data.plan == 'Professional'){renewFre=110}
    // if(data.plan == 'Enterprise'){renewFre=550}
    // let output='';
    // let serializedPlan= null;
    // let Usageresult = null;
    // console.log('MED: ',new Date(data?.monthenddate), "CD: ",currentDate)
    // if(new Date(data?.monthenddate) < currentDate) {//monthdate is less means plan expired
    //   output = 'Plan has expired, returning null';
    //   console.log('plan expired creating new usage data');
    //   Usageresult = await trackUsage({ planId:data?.id, userId:data?.userId, email:data?.user?.email, planName:data?.plan });
    //   if (Usageresult?.error) {
    //     console.log('user result error: ',Usageresult?.error);
    //     return NextResponse.json({ error: Usageresult.error }, { status: 400 });
    //   }
    //   console.log('plan expired creating new plan details');
      
    //   const { data:updatedPlan, error } = await supabase
    //     .from('plan_details')
    //     .update({
    //       plan: data.plan ? data.plan : '',
    //       frequency: data.plan ? renewFre : 0,
    //       date: data.plan ? currentDate.toISOString() : '',
    //       monthenddate: data.plan ? nextMonthDate.toISOString() : '',
    //       subscriptionid: data.plan ? data.subscriptionid : '',
    //     }) 
    //     .eq('userId', Number(id))
    //     .select()
    //     .single();

    //   serializedPlan = {
    //     ...updatedPlan,
    //     id: updatedPlan.id.toString(),
    //     userId: updatedPlan.userId.toString(),
    //     frequency: updatedPlan.frequency?.toString() ?? null,
    //     user: {
    //       ...data.user,
    //       id: data.user?.id?.toString(),
    //     },
    //   };

      
    // }else{
    //   console.log('plan not expires, geting data');
      
    //   serializedPlan = {
    //   ...data,
    //   id: data.id.toString(),
    //   userId: data.userId.toString(),
    //   frequency: data.frequency?.toString() ?? null,
    //   user: {
    //     ...data.user,
    //     id: data.user?.id?.toString(),
    //   },
    // };
    // }

  return NextResponse.json({ success: true, plan: serializedPlan });
  } catch (error) {
    console.error('Error fetching plan by userId:', error);
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 });
  }
}
