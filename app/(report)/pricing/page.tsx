'use client';

import { useState, useEffect } from 'react';
import { SUBSCRIPTION_PLANS, Plan } from '../../../lib/plans';
import Link from 'next/link';
import { ShinyButton } from '@/components/magicui/shiny-button';
import { useAuth } from '@/context/AuthContext';
import { verify } from 'crypto';
import ComingSoon from '@/components/ui/coming-soon';

declare global {
  interface Window {
    Razorpay: any;
  }
}


export default function PricingPage() {
  const { currentUser, fetchUser, setCreditsData, hasExpired, setDisabledCards,disabledCards } = useAuth();

  const [plans, setPlans] = useState<Plan[]>(SUBSCRIPTION_PLANS);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  

  useEffect(() => {
    console.log('Current User:', currentUser);
    console.log("hasExpired",hasExpired);
    
    
    setCreditsData(currentUser?.frequency || 5);
  }, [currentUser])

  console.log("disabledCards:", disabledCards);


  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/subscription');
        const data = await response.json();

        // console.log('Fetched subscription:', data?.data);
        if (data?.success) {
          const mergedPlans = SUBSCRIPTION_PLANS.map(plan => {
            const matchedItem = data.data.items.find((item: any) => item?.item?.name === plan.name);
            return {
              ...plan,
              plan_id: matchedItem?.id || null
            };
          });
          console.log('Merged Plans:', mergedPlans);
          setPlans(mergedPlans);
        }


      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };


  // const clickHandler = async(planId :string, email:string)=>{
  //    console.log('Selected Plan ID:', planId);
  //    console.log('User Email:', email);
  // }

  const cancelHandler = async (subscriptionid: string | undefined, plan: Plan | null) => {
    if (!subscriptionid) return;
    const confirmCancel = window.confirm('Are you sure you want to cancel this subscription?');
    if (confirmCancel) {
      const res = await fetch(`/api/subscription/cancel`, {
        method: 'POST',
        body: JSON.stringify({ subscriptionid }),
      });

      if (!res.ok) {
        console.error('Error canceling subscription:', res.statusText);
        return;
      }

      const data = await res.json();
      console.log('Subscription canceled successfully:', data);
      const updatedData = await fetchUser();
      console.log("Updated user data:", updatedData);
      setDisabledCards([]);
      // if (plan?.id) {
      //   updatePlanDetails({ id: plan.id, name: currentUser?.plan, monthly_limit: Number(currentUser?.frequency) }, String(currentUser?.subscriptionid));
      // } else {
      //   console.error('Plan ID is undefined');
      // }

    } else {
      console.log('failed to cancel the subscription');

    }


  }

  const clickHandler = async (planId: string, email: string, plan: Plan) => {
    setCurrentPlan(plan);
    console.log('Selected Plan ID:', planId, 'User Email:', email, 'Plan Details:', plan);
    const queryBody = {
      planId: planId,
      customerEmail: email
    }
    const res = await fetch('/api/subscription', {
      method: 'POST',
      body: JSON.stringify(queryBody),
    });



    const { subscriptionId } = await res.json();
    console.log('Created Subscription ID:', subscriptionId);

    const response = await loadRazorpayScript();
    const options = {
      key: process.env.RAZORPAY_KEY_ID,
      subscription_id: subscriptionId,
      name: 'AskAlpha',
      description: 'Subscription',
      prefill: {
        email: `${email}`,
      },
      theme: {
        color: '#528FF0',
      },
      handler: (response: any) => {
        console.log("razorpay", response.razorpay_subscription_id, response.razorpay_payment_id, response.razorpay_signature);
        verifySignature(response.razorpay_payment_id, response.razorpay_subscription_id, response.razorpay_signature, plan);
      },
    };
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const verifySignature = async (paymentID: string, subscriptionID: string, signature: string, plan: Plan) => {
    const queryBody = {
      razorpay_payment_id: paymentID,
      razorpay_subscription_id: subscriptionID,
      razorpay_signature: signature
    };

    try {
      const res = await fetch('/api/subscription/verify', {
        method: 'POST',
        body: JSON.stringify(queryBody),
      });

      if (!res.ok) {
        throw new Error('Signature verification failed');
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Signature verification failed');
      }
      console.log('Signature verification response:', data.message);
      updatePlanDetails(plan, subscriptionID);

    } catch (error) {
      console.error('Error verifying signature:', error);
    }
  }

  const updatePlanDetails = async (plan: Partial<Plan>, subscriptionID: String) => {
    console.log('Updating plan details...');
    const currentDate = new Date();
    let newMonthEndDate = '';
    const nextMonthDate = new Date(currentDate);
    const nextYearDate = new Date(currentDate);
    nextMonthDate.setMonth(currentDate.getMonth() + 1);
    nextYearDate.setFullYear(currentDate.getFullYear() + 1);
    if (plan?.name == 'Free') {
      newMonthEndDate = nextYearDate.toISOString();
    } else {
      newMonthEndDate = nextMonthDate.toISOString();
    }

    if (!plan) {
      console.log('No current plan selected for update');
      return;
    };
    const planID = plan?.id;
    const userID = currentUser?.id;
    const { name, monthly_limit } = plan;
    console.log('Updating plan details for Plan Name:', name, 'Monthly Limit:', monthly_limit, 'User ID:', userID, 'Subscription ID:', subscriptionID, "newMonthEndDate", newMonthEndDate);
    try {
      const res = await fetch(`/api/plan-details/${userID}`, {
        method: 'POST',
        body: JSON.stringify({ name, monthly_limit, subscriptionID, MonthEndDate: newMonthEndDate }),
      });

      if (!res.ok) {
        throw new Error('Signature verification failed');
      }

      const UpdateddataRes = await res.json();



      if (!res.ok) {
        throw new Error('Failed to update plan details');
      }

      console.log("database updated", UpdateddataRes);

      const updatedData = await fetchUser();
      console.log("Updated user data:", updatedData);

    } catch (error) {
      console.error('Error updating plan details:', error);

    }
  }


  return (
      <div className="min-h-screen bg-[#0a0c10] text-zinc-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-zinc-200 ring-1 ring-inset ring-white/10 mb-6 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            AI-Powered Financial Analysis
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            {currentUser && currentUser.plan ? currentUser.plan : 'Choose Your Plan'}
          </h1>
          {(currentUser?.monthenddate && currentUser?.plan !== 'Free') && (
            <h3>
              Your plan ends on{' '}
              {new Date(currentUser.monthenddate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </h3>
          )}

          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Unlock the power of AI-driven financial insights. Get comprehensive company analysis, market research, and investment recommendations.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 mt-8">
          {
            plans.map((plan) => {
              const isDisabled = disabledCards?.includes(plan.name);
              const isCurrentPlan = plan.name === currentUser?.plan;

              return (
                <div key={plan.id} className={`relative rounded-2xl shadow-xl border overflow-hidden duration-300 ${isCurrentPlan
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/5 border-white/10'} ${!isDisabled && !isCurrentPlan
                    ? 'hover:shadow-2xl hover:scale-105 transition-all' : 'opacity-50 cursor-not-allowed'} ${isDisabled
                      ? 'pointer-events-none' : ''} `}>
                  <div className="p-8 flex flex-col h-full">

                    {/* Header and price section */}
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-zinc-400 mb-6">
                        {plan.description}
                      </p>
                      <div className="flex items-center justify-center mb-2">
                        <span className="text-4xl font-bold text-white">
                          ${plan.price}
                        </span>
                        <span className="text-zinc-400 ml-2">
                          /month
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500">
                        {plan.monthly_limit} AI recommendations included
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8 flex-1">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <svg className="h-5 w-5 text-emerald-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd" />
                          </svg>
                          <span className="text-zinc-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <ShinyButton disabled={isCurrentPlan || isDisabled} className={`w-full mb-4 py-4 px-6 text-lg justify-center transition-all duration-200 mt-auto ${isCurrentPlan || isDisabled ? '!bg-white/10 !text-zinc-400 cursor-not-allowed' : ''}`} onClick={() => {
                        if (
                          !isDisabled &&
                          plan.plan_id &&
                          currentUser?.user?.email &&
                          plan.name !== currentUser?.plan
                        ) {
                          clickHandler(plan.plan_id, currentUser.user.email, plan);
                        }
                      }}
                    >
                      {isCurrentPlan ? 'Your Current Plan' : 'Get Started'}
                    </ShinyButton>

                    {/* Cancel Plan */}
                    {!isDisabled && (
                      <div onClick={() => {
                        cancelHandler(currentUser?.subscriptionid, plan);
                      }}
                        className="absolute bottom-1"
                      >
                        <p className="text-blue-600 cursor-pointer underline">
                          {isCurrentPlan && !hasExpired && 'Cancel Plan'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          }
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/5 rounded-xl p-6 shadow-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">
                What happens when I reach my monthly limit?
              </h3>
              <p className="text-zinc-400">
                Once you reach your monthly AI recommendation limit, you'll need to upgrade your plan or wait until the next billing cycle for your limit to reset.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 shadow-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">
                What is the Research Tool?
              </h3>
              <p className="text-zinc-400">
                The Research Tool provides access to real-time market data, advanced analytics, and in-depth financial research capabilities available only with Enterprise plans.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 shadow-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">
                Can I change my plan anytime?
              </h3>
              <p className="text-zinc-400">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 shadow-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">
                Is there a free trial?
              </h3>
              <p className="text-zinc-400">
                We offer a free trial with the Basic plan so you can experience our AI-powered financial analysis before committing to a subscription.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-zinc-400 mb-6">
            Need a custom solution for your organization?
          </p>
          <Link href="/contact">
            <ShinyButton className="!bg-white/5 !text-zinc-200 !ring-white/10">Contact Sales</ShinyButton>
          </Link>
        </div>
      </div>
    </div>
  );
} 