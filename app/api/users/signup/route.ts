import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import bcrypt from "bcrypt";
import supabase from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // 1. First create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // Add name to metadata
      },
    });

    if (authError) {
      console.error("Supabase auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const createPlan = async (userId: number) => {
      try {
        console.log("Creating plan for user:", userId);

        const parsedDate = new Date();
        const nextMonthDate = new Date(parsedDate);
        nextMonthDate.setMonth(parsedDate.getMonth() + 1);
        const nextYearDate = new Date(parsedDate);
        nextYearDate.setFullYear(parsedDate.getFullYear() + 1);

        const { data, error } = await supabase
          .from("plan_details")
          .insert([
            {
              plan: "Free",
              frequency: 5,
              date: new Date().toISOString(),
              userId: Number(userId),
              monthenddate: nextYearDate.toISOString(),
              subscriptionid: "",
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("Error creating plan:", error);
        }

        console.log("Plan created:", data);
      } catch (err) {
        console.error("Error:", err);
      }
    };

    // 2. Check if user already exists in your custom table
    const { data: existingUsers, error: existingError } = await supabase
      .from("app_user")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (existingError) {
      console.error("Error checking existing user:", existingError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert into your custom table
    const { data: newUser, error: insertError } = await supabase
      .from("app_user")
      .insert([
        {
          email,
          password: hashedPassword,
          name,
          auth_user_id: authData.user?.id, // Store Supabase auth ID for reference
        },
      ])
      .select()
      .single();

    if (insertError || !newUser) {
      console.error("Error inserting user:", insertError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    
    createPlan(newUser.id);

    // 4. Sign your custom token
    const token = await signToken({
      id: Number(newUser.id),
      email: newUser.email,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        ...newUser,
        id: Number(newUser.id),
      },
      token,
    });

    // Set JWT cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
