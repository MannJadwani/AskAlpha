"use client"; // This is a client component

import React, { createContext, useContext, useEffect, useState } from "react";
import { CurrentUser } from "@/types/auth";
import { log } from "node:console";
import supabase from '@/lib/supabase'

interface AuthContextType {
  currentUser: CurrentUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
  fetchUser: () => Promise<CurrentUser | null>;
  creditsData: any; // You can replace 'any' with a specific type if available
  setCreditsData: React.Dispatch<React.SetStateAction<any>>;
  hasExpired: boolean;
  disabledCards: string[]; // Updated: array of strings
  setDisabledCards: React.Dispatch<React.SetStateAction<string[]>>; // Proper setter
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [creditsData, setCreditsData] = useState(5);
  const [hasExpired, sethasExpired] = useState(false);
  const [disabledCards, setDisabledCards] = useState<string[]>([]);
  const fetchUser = async () => {
    console.log("Fetching user data...");

    try {
      // Get Supabase auth session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting Supabase session:", sessionError);
      } else if (session) {
        console.log("Supabase auth user:", session.user);
      } else {
        console.log("No Supabase auth session found");
      }

      // Fetch your app user data
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Not authenticated");
      const data = await res.json();
      if (!data.user) throw new Error("No user data found");
      console.log("User data fetched successfully:", data.user);

      // Verify that the Supabase auth user matches your app user (if both exist)
      if (session && session.user.email !== data.user.email) {
        console.warn("Supabase auth user email does not match app user email");
        console.warn("Supabase:", session.user.email, "App:", data.user.email);
      }

      const planUser = await fetchPlanById(data.user.id.toString());
      return planUser;
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setCurrentUser(null);
      return null;
    }
  };

  const hasSubscriptionExpired = async (subscriptionId: string) => {
    try {
      console.log("checking for subscriptionid:..", subscriptionId);

      const res = await fetch(`/api/subscription/${subscriptionId}`);
      const subscriptionData = await res.json();
      console.log("subscriptionData....", subscriptionData);
      if (
        subscriptionData?.subscription?.status == "expired" ||
        subscriptionData?.subscription?.status == "cancelled"
      ) {
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("error fetching subscription details", error.message);
      return true;
    }
  };

  const fetchPlanById = async (id: string) => {
    try {
      const res = await fetch(`/api/plan-details/${id}`);
      const data = await res.json();
      setCurrentUser(data?.plan);
      console.log("Fetched plan data:", data);
      const currentDate = new Date();
      const nextYearDate = new Date(currentDate);
      nextYearDate.setFullYear(currentDate.getFullYear() + 1);
      const subscriptionId = data?.plan?.subscriptionid;
      if (subscriptionId) {
        const expired = await hasSubscriptionExpired(
          data?.plan?.subscriptionid
        );
        sethasExpired(expired);

        if (expired) {
          if (new Date(data?.plan?.monthenddate) < currentDate) {
            console.log("expired and month date is also expired");
            const planres = await fetch(`/api/plan-details/${data?.plan?.id}`, {
              method: "POST",
              body: JSON.stringify({
                name: "Free",
                monthly_limit: 5,
                subscriptionID: "",
                MonthEndDate: nextYearDate.toISOString(),
              }),
            });

            if (!planres.ok) {
              throw new Error("getting plan details failed");
            }

            const UpdateddataRes = await planres.json();
            console.log("free plan added", UpdateddataRes);
          } else {
            console.log("expired but month date is not passed yet");
          }
        } else {
          console.log("plan has not expires yet");
          if (data?.plan?.plan == "Professional") {
            setDisabledCards(["Basic"]);
          } else if (data?.plan?.plan == "Enterprise") {
            setDisabledCards(["Basic", "Professional"]);
          } else {
            setDisabledCards([]);
          }
        }
        console.log("has subsciption expired: ", expired);
      } else {
        //no subscriptionId exists
        console.log("its a free plan");
      }

      setCreditsData(Number(data?.plan?.frequency));

      return data?.plan;
    } catch (error) {
      console.error("Error fetching plan by ID:", id, error);
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        fetchUser,
        creditsData,
        setCreditsData,
        hasExpired,
        setDisabledCards,
        disabledCards,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
