"use client";

import React from "react";
import { AlertTriangle, Info, Shield, User, CheckCircle } from "lucide-react";
import Footer_01 from "@/components/ui/Footer";

const Page: React.FC = () => {
  return (
    <>
    <div className="max-w-5xl mx-auto p-2 sm:p-16 bg-[#0a0c10] min-h-screen pt-16 mt-[2.5rem] text-gray-100">
      {/* Header */}
      <div className="border-b border-amber-600 pb-2 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h1 className="text-base sm:text-lg font-bold text-gray-100">
            TERMS OF USE
          </h1>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Shield className="w-3 h-3" />
          <span>Important Disclaimers and Guidelines</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-3">
        {/* Independent Judgment */}
        <div className="bg-amber-950 border border-amber-700 rounded-md p-3">
          <div className="flex items-start gap-2">
            <div className="bg-amber-900 p-1 rounded-full">
              <User className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-100 mb-1 text-xs">
                Independent Judgment Required
              </h2>
              <div className="bg-gray-900 p-2 rounded border-l-2 border-amber-500">
                <p className="text-gray-300 text-xs">
                  This report may not be taken in substitution for the exercise
                  of independent judgment by the clients / legitimate users.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Not Investment Advice */}
        <div className="bg-red-950 border border-red-700 rounded-md p-3">
          <div className="flex items-start gap-2">
            <div className="bg-red-900 p-1 rounded-full">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-100 mb-1 text-xs">
                Not Investment Advice
              </h2>
              <div className="bg-gray-900 p-2 rounded border-l-2 border-red-600">
                <p className="text-gray-300 text-xs">
                  The research report must not be considered as Investment
                  Advice or legal opinion or accounting & audit opinion or tax
                  consultancy in any manner. The intent of this report is
                  neither to provide personal recommendation to any specific
                  client nor any solicitation or endorsement of any investment
                  opportunity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Factors */}
        <div className="bg-blue-950 border border-blue-700 rounded-md p-3">
          <div className="flex items-start gap-2">
            <div className="bg-blue-900 p-1 rounded-full">
              <Info className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-100 mb-1 text-xs">
                Individual Factors Not Considered
              </h2>
              <div className="bg-gray-900 p-2 rounded border-l-2 border-blue-500">
                <p className="text-gray-300 text-xs mb-2">
                  Investment advice is based on risk profile, investment goals,
                  financial situation, time horizon of investment, amount of
                  investment and other such details that are specific and unique
                  to each investor. All these factors are not considered in this
                  report.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-xs text-gray-400">
                  {[
                    "Risk Profile",
                    "Investment Goals",
                    "Financial Situation",
                    "Time Horizon",
                    "Investment Amount",
                    "Other Details",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Advice */}
        <div className="bg-green-950 border border-green-700 rounded-md p-3">
          <div className="flex items-start gap-2">
            <div className="bg-green-900 p-1 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-100 mb-1 text-xs">
                Professional Advice Recommended
              </h2>
              <div className="bg-gray-900 p-2 rounded border-l-2 border-green-500">
                <p className="text-gray-300 text-xs">
                  Hence, it is strongly advised to the clients to take the
                  investment decision with prudent application of mind or seek
                  independent professional advice to arrive at an informed
                  decision.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-gray-900 border border-gray-700 rounded-md p-3">
          <div className="text-center">
            <h3 className="font-semibold text-gray-100 mb-1 text-xs">
              Important Notice
            </h3>
            <p className="text-xs text-gray-400">
              By using this research report, you acknowledge that you have read,
              understood, and agree to be bound by these terms of use. Please
              consult with qualified financial advisors before making any
              investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="mt-10 flex text-xs text-zinc-500">
        <Footer_01 />
      </div>
    </>
  );
};

export default Page;
