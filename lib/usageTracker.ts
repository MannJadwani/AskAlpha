// lib/usageTracker.ts
import supabase from '@/lib/supabase';


interface UsageEntry {
  id: number;
  usage: number;
  monthCycleEndDate: string;
  planName:string;
  plan: {
    id: number;
    plan: string;
    monthenddate: string;
  };
  user: {
    id: number;
    email: string;
  };
}


export const trackUsage = async ({
  planId,
  userId,
  email,
  planName,
}: {
  planId: string;
  userId: string;
  email: string;
  planName: string;
}) => {
  // Step 1: Get user by email
  console.log('Get user by email');

  const { data: user, error: userError } = await supabase
    .from('app_user')
    .select('id')
    .eq('email', email)
    .single();

  if (userError || !user) {
    return { error: 'User not found.' };
  }

  // Step 2: Get plan by planName and userId
  // console.log('Get plan by planName and userId');
  // const { data: plan, error: planError } = await supabase
  //   .from('plan_details')
  //   .select('id')
  //   .eq('plan', planName)
  //   .eq('userId', userId)
  //   .single();

  // if (planError || !plan) {
  //   return { error: 'Plan not found.' };
  // }

  // Step 3: Check usage_data for matching entry
  console.log('Check usage_data for matching entry');
  const today = new Date();
  const nextMonthDate = new Date(today);
  nextMonthDate.setMonth(today.getMonth() + 1);
  const { data: usageEntries, error: usageError } = await supabase
    .from('usage_data')
    .select(`
      id,
      usage,
      monthCycleEndDate,
      planName,
      plan (
        id,
        plan,
        monthenddate
      ),
      user (
        id,
        email
      )
    `)
    .eq('user', user.id)
    .eq('planName', planName) as unknown as { data: UsageEntry[]; error: any };

  if (usageError) return { error: usageError.message };

  if (!usageEntries || usageEntries.length === 0) {
    // No entries — create new one
    console.log('No entries — create new one');
    const { data: created, error: insertError } = await supabase
      .from('usage_data')
      .insert([{ user: userId, plan: planId, usage: 1, monthCycleEndDate: nextMonthDate.toISOString(), planName:planName }])
      .select();

    if (insertError) return { error: insertError.message };
    return { message: 'New usage entry created.', data: created };
  }

  // Entry exists, check expiry
  console.log('Entry exists, check expiry',usageEntries);

  const validEntry = usageEntries?.find(entry => new Date(entry?.monthCycleEndDate) > today);

  if (validEntry) {
    console.log('not expired, updating usage Data');
    const { data: updated, error: updateError } = await supabase
      .from('usage_data')
      .update({ usage: validEntry.usage + 1 })
      .eq('id', validEntry.id)
      .select();

    if (updateError) return { error: updateError.message };
    return { message: 'Usage updated successfully.', data: updated };
  } else {
    console.log('planexpired, new entry create');


    const { data: newlyCreated, error: insertError } = await supabase
      .from('usage_data')
      .insert([{ user: userId, plan: planId, usage: 1, monthCycleEndDate: nextMonthDate.toISOString(),planName:planName }])
      .select();

    if (insertError) return { error: insertError.message };
    return { message: 'New usage entry created.', data: newlyCreated };
  }
};
