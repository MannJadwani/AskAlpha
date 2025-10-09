"use client";

import React, { useState, ReactNode } from "react";
import { FileText, Shield, Info, ChevronDown, ChevronUp } from "lucide-react";
import Footer_01 from "@/components/ui/Footer";

interface CollapsibleSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-700 rounded-md mb-4 bg-gray-900 shadow-sm">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 focus:outline-none group"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-100">
          {icon}
          {title}
        </span>
        <span className="text-gray-400">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {open && <div className="px-5 pb-4 text-xs text-gray-300">{children}</div>}
    </div>
  );
}

const Page: React.FC = () => {
  return (
    <>
    <div className="max-w-5xl mx-auto p-2 sm:p-16 bg-[#0a0c10] min-h-screen pt-16 mt-[2.5rem] text-gray-100">
      {/* Header */}
      <div className="border-b border-blue-600 pb-2 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-6 h-6 text-blue-500" />
          <h1 className="text-lg font-bold text-gray-100 tracking-tight">
            DISCLOSURES
          </h1>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Shield className="w-3 h-3" />
          <span>SEBI Registered Research Analyst (INH000021377)</span>
        </div>
      </div>

      {/* Purpose */}
      <div className="bg-blue-950 border-l-4 border-blue-600 px-3 py-2 rounded-r mb-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5" />
          <div>
            <h2 className="font-semibold text-xs text-gray-100 mb-0.5">
              Purpose of this Document
            </h2>
            <p className="text-xs text-gray-300">
              This Disclosure Document is prepared as per{" "}
              <span className="font-medium text-blue-400">
                SEBI (Research Analyst) Regulations, 2014
              </span>
              . It provides essential info about our research/recommendation
              services for clients’ informed decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div className="mb-5 grid md:grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-700 rounded-md p-3 flex flex-col gap-2 shadow-sm">
          <div>
            <h3 className="font-semibold text-gray-300 mb-0.5 flex items-center gap-1 text-xs">
              <Shield className="w-4 h-4 text-green-400" />
              Registered Entity
            </h3>
            <div className="text-xs text-gray-200 font-medium">
              Beacon Capital Advisors Pvt Ltd
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-300 mb-0.5 flex items-center gap-1 text-xs">
              <FileText className="w-4 h-4 text-blue-400" />
              Trade Name
            </h3>
            <div className="text-xs text-gray-200 font-medium">Equivision</div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-300 mb-0.5 text-xs">
              SEBI Registration
            </h3>
            <div className="flex flex-col gap-0.5">
              <span>
                <span className="text-gray-400">Reg. No: </span>
                <span className="font-mono bg-green-900 text-green-300 px-1 py-0.5 rounded border border-green-700">
                  INH000021377
                </span>
              </span>
              <span className="text-gray-500 text-[11px]">
                SEBI Research Analyst, since 7th July 2025
              </span>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-md p-3 flex flex-col gap-2 shadow-sm">
          <h3 className="font-semibold text-gray-300 mb-0.5 text-xs">
            Services Provided
          </h3>
          <div>
            <span className="font-medium text-blue-400 text-xs">
              Equity Research Services
            </span>
            <div className="text-gray-400 text-[11px]">
              Research & recommendations for equity investments.
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Sections */}
      <CollapsibleSection
        title="A. About the Research Entity"
        icon={<Info className="w-4 h-4 text-blue-400" />}
        defaultOpen
      >
        <ul className="list-disc ml-5 space-y-1">
          <li>
            <b>History:</b> SEBI registered since 7 July 2025 for research &
            recommendation.
          </li>
          <li>
            <b>Focus:</b> Client-aligned, unbiased research/recommendations.
          </li>
          <li>
            <b>No financial interest/ownership:</b> No 1%+ holding or interest
            in covered companies.
          </li>
          <li>
            <b>No conflict:</b> No material conflict in recommended companies.
          </li>
          <li>
            <b>No compensation/public issue:</b> No such
            compensation/public issue managed.
          </li>
          <li>
            <b>No 3rd party compensation:</b> No payments from anyone but
            clients.
          </li>
          <li>
            <b>SEBI Registration:</b> SEBI/NISM certification doesn’t guarantee
            performance/returns.
          </li>
        </ul>
      </CollapsibleSection>

      <CollapsibleSection
        title="Disclosure: Terms, Disciplinary History & Associates"
        icon={<FileText className="w-4 h-4 text-blue-400" />}
      >
        <ul className="list-disc ml-5 space-y-1">
          <li>
            <b>Terms:</b> See our full Terms & Conditions document.
          </li>
          <li>
            <b>No disciplinary history:</b> No material litigation, regulatory
            action, or finding.
          </li>
          <li>
            <b>No associates.</b>
          </li>
        </ul>
      </CollapsibleSection>

      <CollapsibleSection
        title="B. Disclosures: Research & Recommendation Services"
        icon={<Shield className="w-4 h-4 text-green-400" />}
      >
        <ul className="list-disc ml-5 space-y-1">
          <li>No trading by us in securities we recommend.</li>
          <li>
            No actual/potential conflicts (any, if arises, will be disclosed).
          </li>
          <li>No compensation from companies we recommend.</li>
          <li>No managed/co-managed public offering.</li>
          <li>
            No investment/merchant/brokerage compensation from covered
            companies.
          </li>
          <li>
            No 3rd party/subject company compensation for this research.
          </li>
          <li>
            Covered companies are not our/associate clients for past 12 months.
          </li>
          <li>No employee/officer/director ties with covered companies.</li>
          <li>No market making activity for subject companies.</li>
          <li>
            Reports have no Unpublished Price Sensitive Information, non-public
            info, or investment tips.
          </li>
        </ul>
      </CollapsibleSection>

      {/* Standard Warning and Disclaimer */}
      <div className="bg-yellow-900 border-l-4 border-yellow-600 px-3 py-2 rounded-r mb-2 mt-5">
        <div className="font-semibold mb-0.5 text-yellow-300 text-xs">
          Standard Warning
        </div>
        <div className="text-[11px] text-yellow-200">
          “Investments in securities are subject to market risks. Read all
          documents carefully before investing.”
        </div>
      </div>

      <div className="bg-gray-800 border-l-4 border-gray-600 px-3 py-2 rounded-r mb-2">
        <div className="font-semibold mb-0.5 text-gray-200 text-xs">
          Disclaimer
        </div>
        <ul className="text-[11px] text-gray-300 list-disc ml-4 space-y-0.5">
          <li>
            SEBI/NISM registration/certification does not guarantee analyst
            performance or returns.
          </li>
          <li>
            Reports are not to be considered Unpublished Price Sensitive
            Information or investment tips.
          </li>
        </ul>
      </div>

      {/* Footer Notice */}
      <div className="border-t border-gray-700 pt-3 mt-4">
        <p className="text-[10px] text-gray-500 text-center">
          Disclosure as per SEBI (Research Analyst) Regulations, 2014. Read all
          disclosures before investing.
        </p>
      </div>
    </div>
    <div className="mt-10 flex text-xs text-zinc-500">
        <Footer_01 />
      </div>
    </>
  );
};

export default Page;
