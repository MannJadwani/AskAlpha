export interface Plan {
  id: string;
  name: string;
  price: number;
  monthly_limit: number;
  research_access: boolean;
  razorpay_plan_id?: string;
  description: string;
  features: string[];
  plan_id?: string; // Optional field for Razorpay plan ID
}

// Define the 3 plans as per Step 1
export const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 20,
    monthly_limit: 50,
    research_access: false,
    description: 'Perfect for individual users getting started',
    features: [
      '50 AI recommendations per month',
      'Company analysis reports',
      'Basic market insights',
      'Email support'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 40,
    monthly_limit: 110,
    research_access: false,
    description: 'Ideal for professionals and small teams',
    features: [
      '110 AI recommendations per month',
      'Advanced company analysis',
      'Market trend insights',
      'Priority email support',
      'Export to PDF'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 200,
    monthly_limit: 550,
    research_access: true,
    description: 'Complete solution for teams and organizations',
    features: [
      '550 AI recommendations per month',
      'Research Tool access',
      'Advanced analytics',
      'Real-time market data',
      'Priority support',
      'Custom integrations',
      'Team management'
    ]
  }
];

// Helper functions
export const getPlanById = (id: string): Plan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === id);
};

export const getPlanByPrice = (price: number): Plan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.price === price);
};

export const getDefaultPlan = (): Plan => {
  return SUBSCRIPTION_PLANS[0]; // Basic plan
};

export const canAccessResearchTool = (planId: string): boolean => {
  const plan = getPlanById(planId);
  return plan ? plan.research_access : false;
};

export const getRemainingUsage = (currentUsage: number, planId: string): number => {
  const plan = getPlanById(planId);
  if (!plan) return 0;
  return Math.max(0, plan.monthly_limit - currentUsage);
};

export const hasUsageLimit = (currentUsage: number, planId: string): boolean => {
  const plan = getPlanById(planId);
  if (!plan) return true;
  return currentUsage >= plan.monthly_limit;
}; 