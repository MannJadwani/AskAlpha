"use client";

import React from "react";
import {
  AlertTriangle,
  Shield,
  FileText,
  TrendingUp,
} from "lucide-react";
import Footer_01 from "@/components/ui/Footer";

const Page: React.FC = () => {
  return (
    <>
      <div className="w-[750px] max-w-full sm:max-w-lg md:max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto p-6 bg-[#0a0c10] text-gray-100 mt-[3rem] rounded-lg shadow-md">
        {/* Header */}
        <div className="bg-gray-800 border-l-4 border-blue-500 p-6 mb-8 rounded-lg">
          <div className="flex items-center mb-4">
            <Shield className="h-8 w-8 text-blue-400 mr-3" />
            <div className="text-lg sm:text-base font-semibold text-blue-100">
              DISCLAIMER
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-300 text-sm leading-relaxed">
              <strong>Beacon Capital Advisors Private Limited</strong> (CIN:
              U74999MH2021PTC359682), registered with SEBI as a Research Analyst
              under the SEBI (Research Analyst) Regulations, 2014 (Registration
              No:{" "}
              <span className="underline font-semibold text-blue-400">
                INH000021377
              </span>
              ), provides equity research services under the trade name{" "}
              <strong>'Equivision'</strong>.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-blue-400 mr-2" />
              <div className="text-lg sm:text-base font-semibold text-blue-200">
                Company Information
              </div>
            </div>
            <ul className="space-y-3 text-gray-300 text-sm">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Equivision owns the website -
                <a
                  href="https://equivision.in"
                  className="text-blue-400 hover:underline ml-1"
                >
                  www.equivision.in
                </a>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Equivision makes research-based recommendations on various
                opportunities in the Indian equity market for the short and long
                term.
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                We have never been suspended or barred from doing business by SEBI
                or any other authority, nor has SEBI ever cancelled our
                certificate of registration.
              </li>
            </ul>
          </div>

          {/* Research Report Definition */}
          <div className="bg-amber-900/30 p-6 rounded-lg border border-amber-600">
            <div className="text-lg sm:text-base font-semibold text-amber-400 mb-3">
              Research Report Definition
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Research Report means any written or electronic communication that
              includes research analysis or research recommendation or an opinion
              concerning securities or public offer, providing a basis for
              investment decision.
            </p>
          </div>

          {/* Key Points */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-900/30 p-6 rounded-lg border border-green-600">
              <div className="text-lg sm:text-base font-semibold text-green-400 mb-3">
                Our Research Reports
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Our research report offers only opinion / information / views /
                price target / buy, sell, hold calls / recommendations which is
                specific to the securities / industry / sector of the subject
                company mentioned in the report.
              </p>
            </div>

            <div className="bg-purple-900/30 p-6 rounded-lg border border-purple-600">
              <div className="text-lg sm:text-base font-semibold text-purple-400 mb-3">
                Information Sources
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                The research report is based on our analysis and assessment from
                the facts, figures and information available in public domain &
                other sources that are considered true, correct, reliable, and
                accurate.
              </p>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-red-900/30 border-l-4 border-red-600 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400 mr-2" />
              <div className="text-lg sm:text-base font-semibold text-red-400">
                Important Notice
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Such information has not been independently verified or audited by
              us and no guaranty, representation of warranty, express or implied,
              is made as to its accuracy, completeness or correctness. All such
              information and opinions are subject to change without notice.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              All relevant data as on the date of issuance of the report are
              considered. The value of securities referred to herein may be
              adversely affected by market conditions, performance of subject
              companies, and other economic or geopolitical factors.
            </p>
          </div>

          {/* Liability and Confidentiality */}
          <div className="space-y-4">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-lg sm:text-base font-semibold text-gray-100 mb-3">
                Liability Disclaimer
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                While due care has been taken to ensure that the disclosures and
                opinions given are fair and reasonable, none of the directors,
                employees, affiliates or representatives of Equivision shall be
                liable for any direct, indirect, special, incidental,
                consequential, punitive or exemplary damages, including lost
                profits arising in any way whatsoever from the information /
                opinions / views contained in this Report.
              </p>
            </div>

            <div className="bg-blue-900/30 p-6 rounded-lg border border-blue-600">
              <div className="text-lg sm:text-base font-semibold text-blue-400 mb-3">
                Confidentiality
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                This report is meant solely for the recipient client of Equivision
                and not for circulation. The report and information contained
                herein are strictly confidential and may not be copied, reprinted,
                or distributed without prior written consent of Equivision.
              </p>
            </div>
          </div>

          {/* Risk Warnings */}
          <div className="bg-yellow-900/30 border-2 border-yellow-600 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-6 w-6 text-yellow-400 mr-2" />
              <div className="text-lg sm:text-base font-semibold text-yellow-400">
                Risk Warnings
              </div>
            </div>
            <ul className="space-y-3 text-gray-300 text-sm">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Certain transactions including derivatives, futures, and options
                involve substantial risk and may not be suitable for all
                investors.
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Past performance is not necessarily a guide to future performance.
                Actual results may differ materially from projections.
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Being registered with SEBI as Research Analyst does not guarantee
                assured or risk-free returns.
              </li>
            </ul>
          </div>

          {/* Final Warning */}
          <div className="bg-red-900/40 border-2 border-red-700 p-6 rounded-lg text-center">
            <p className="text-red-400 font-semibold text-lg sm:text-base">
              Investments in securities markets are subject to market risks. Read
              all related documents carefully before investing.
            </p>
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
