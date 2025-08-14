import supabase from './supabase';
import { SUBSCRIPTION_PLANS, Plan } from './plans';
import { Database } from '../types/database.types';

type PlanRow = Database['public']['Tables']['plans']['Row'];
type PlanInsert = Database['public']['Tables']['plans']['Insert'];
type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];

export class SubscriptionService {
  
  // Initialize plans in the database
  static async initializePlans(): Promise<void> {
    try {
      // Check if plans already exist
      const { data: existingPlans } = await supabase
        .from('plans')
        .select('id')
        .limit(1);

      // If plans already exist, don't reinitialize
      if (existingPlans && existingPlans.length > 0) {
        console.log('Plans already initialized');
        return;
      }

      // Insert the predefined plans
      const plansToInsert: PlanInsert[] = SUBSCRIPTION_PLANS.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        monthly_limit: plan.monthly_limit,
        research_access: plan.research_access,
        razorpay_plan_id: plan.razorpay_plan_id || null
      }));

      const { error } = await supabase
        .from('plans')
        .insert(plansToInsert);

      if (error) {
        throw error;
      }

      console.log('Plans initialized successfully');
    } catch (error) {
      console.error('Error initializing plans:', error);
      throw error;
    }
  }

  // Get all plans
  static async getPlans(): Promise<PlanRow[]> {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  }

  // Get plan by ID
  static async getPlanById(planId: string): Promise<PlanRow | null> {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching plan:', error);
      return null;
    }
  }

  // Get user's current subscription
  static async getUserSubscription(userId: string): Promise<SubscriptionRow | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans:plan_id (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      return data;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  // Create a new subscription
  static async createSubscription(subscriptionData: SubscriptionInsert): Promise<SubscriptionRow> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Update subscription
  static async updateSubscription(
    subscriptionId: string, 
    updates: Partial<SubscriptionRow>
  ): Promise<SubscriptionRow> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Increment usage count
  static async incrementUsage(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;

      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          usage_count: subscription.usage_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }

  // Check if user can make more requests
  static async canUserMakeRequest(userId: string): Promise<{
    canMakeRequest: boolean;
    subscription: SubscriptionRow | null;
    plan: PlanRow | null;
    remainingUsage: number;
  }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        return {
          canMakeRequest: false,
          subscription: null,
          plan: null,
          remainingUsage: 0
        };
      }

      const plan = await this.getPlanById(subscription.plan_id);
      
      if (!plan) {
        return {
          canMakeRequest: false,
          subscription,
          plan: null,
          remainingUsage: 0
        };
      }

      const remainingUsage = Math.max(0, plan.monthly_limit - subscription.usage_count);
      const canMakeRequest = remainingUsage > 0;

      return {
        canMakeRequest,
        subscription,
        plan,
        remainingUsage
      };
    } catch (error) {
      console.error('Error checking user request permissions:', error);
      return {
        canMakeRequest: false,
        subscription: null,
        plan: null,
        remainingUsage: 0
      };
    }
  }

  // Reset all usage counts (for monthly reset cron job)
  static async resetAllUsageCounts(): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          usage_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('status', 'active');

      if (error) throw error;
      console.log('All usage counts reset successfully');
    } catch (error) {
      console.error('Error resetting usage counts:', error);
      throw error;
    }
  }
} 