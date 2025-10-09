"use client"

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, FileText, Scale, Shield, LucideIcon } from 'lucide-react';
import Footer_01 from '@/components/ui/Footer';

interface SectionProps {
  id: string;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  highlight?: boolean;
}

const Page = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const Section: React.FC<SectionProps> = ({ id, title, icon: Icon, children, highlight = false }) => {
    const isExpanded = expandedSections[id];
    return (
      <div className={`border rounded-md overflow-hidden ${highlight ? 'border-blue-400 bg-blue-900/20' : 'border-gray-700 bg-gray-800'}`}>
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-300" />
            <h3 className="font-semibold text-gray-100 text-sm">{title}</h3>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
        </button>
        {isExpanded && (
          <div className="px-3 pb-3 text-gray-300 space-y-2 text-xs">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <div className="max-w-5xl mx-auto p-2 sm:p-16 bg-[#0a0c10] min-h-screen pt-16 mt-[2.5rem]">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-100 mb-1">ANNEXURE-B</h1>
        <p className="text-sm text-gray-400">Disclosure of minimum mandatory terms and conditions to clients</p>
        <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700 rounded-md">
          <p className="text-xs text-yellow-300">
            RAs shall disclose to the client the terms and conditions of the research services offered including rights and obligations. 
            RAs shall ensure that neither any research service is rendered nor any fee is charged until consent is received from the client on the terms and conditions.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Section id="availing" title="1. Availing the research services" icon={FileText}>
          <p>By accepting delivery of the research service, the client confirms that he/she has elected to subscribe the research service of the RA at his/her sole discretion. RA confirms that research services shall be rendered in accordance with the applicable provisions of the RA Regulations.</p>
        </Section>
        <Section id="obligations" title="2. Obligations on RA" icon={Scale}>
          <p>RA and client shall be bound by SEBI Act and all the applicable rules and regulations of SEBI, including the RA Regulations and relevant notifications of Government, as may be in force, from time to time.</p>
        </Section>
        <Section id="kyc" title="3. Client Information and KYC" icon={Shield}>
          <p>The client shall furnish all such details in full as may be required by the RA in its standard form with supporting details, if required, as may be made mandatory by RAASB/SEBI from time to time. RA shall collect, store, upload and check KYC records of the clients with KYC Registration Agency (KRA) as specified by SEBI from time to time.</p>
        </Section>
        <Section id="standard-terms" title="4. Standard Terms of Service" icon={FileText}>
          <div className="bg-gray-700/50 p-2 rounded-md">
            <h4 className="font-semibold mb-2 text-xs text-gray-200">Client Consent Statement:</h4>
            <p className="italic mb-2">"I / We have read and understood the terms and conditions applicable to a research analyst as defined under regulation 2(1)(u) of the SEBI (Research Analyst) Regulations, 2014, including the fee structure.</p>
            <p className="italic mb-2">I/We are subscribing to the research services for our own benefits and consumption, and any reliance placed on the research report provided by research analyst shall be as per our own judgement and assessment of the conclusions contained in the research report.</p>
            <p className="italic mb-1">I/We understand that --</p>
            <ul className="list-disc list-inside ml-4 space-y-1 italic">
              <li>Any investment made based on the recommendations in the research report are subject to market risk.</li>
              <li>Recommendations in the research report do not provide any assurance of returns.</li>
              <li>There is no recourse to claim any losses incurred on the investments made based on the recommendations in the research report."</li>
            </ul>
          </div>
          <div className="bg-blue-900/30 p-2 rounded-md mt-3">
            <h4 className="font-semibold mb-2 text-xs text-blue-300">RA Declaration:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>It is duly registered with SEBI as an RA pursuant to the SEBI (Research Analysts) Regulations, 2014</li>
              <li>It has registration and qualifications required to render the services contemplated under the RA Regulations</li>
              <li>Research analyst services provided by it do not conflict with or violate any provision of law</li>
              <li><strong>The maximum fee that may be charged by RA is ₹1.51 lakhs per annum per family of client</strong></li>
              <li>The recommendations provided by RA do not provide any assurance of returns</li>
            </ul>
          </div>
        </Section>
        <Section id="payment" title="5. Consideration and mode of payment" icon={FileText}>
          <p>The client shall duly pay to RA, the agreed fees for the services that RA renders to the client and statutory charges, as applicable. Such fees and statutory charges shall be payable through the specified manner and mode(s)/mechanism(s).</p>
        </Section>
        <Section id="risk" title="6. Risk factors" icon={AlertCircle}>
          <p>(A statement covering the standard risks associated with investment in securities to be added under this clause by the RA)</p>
        </Section>
        <Section id="conflict" title="7. Conflict of interest" icon={AlertCircle}>
          <p>The RA shall adhere to the applicable regulations/circulars/directions specified by SEBI from time to time in relation to disclosure and mitigation of any actual or potential conflict of interest. (A statement covering the mandatory disclosures to be added under this clause by the RA.)</p>
        </Section>
        <Section id="termination" title="8. Termination of service and refund of fees" icon={FileText}>
          <p>Disclosure that the RA may suspend or terminate rendering of research services to client on account of suspension/cancellation of registration of RA by SEBI and shall refund the residual amount to the client.</p>
          <div className="bg-red-900/30 p-2 rounded-md mt-2">
            <p className="text-xs text-red-300">In case of suspension of certificate of registration of the RA for more than 60 (sixty) days or cancellation of the RA registration, RA shall refund the fees, on a pro rata basis for the period from the effective date of cancellation/suspension to end of the subscription period.</p>
          </div>
        </Section>
        <Section id="grievance" title="9. Grievance redressal and dispute resolution" icon={Scale}>
          <p>Any grievance related to (i) non receipt of research report or (ii) missing pages or inability to download the entire report, or (iii) any other deficiency in the research services provided by RA, shall be escalated promptly by the client to the person/employee designated by RA.</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>The RA shall be responsible to resolve grievances within 7 (seven) business working days</li>
            <li>RA shall redress grievances of the client in a timely and transparent manner</li>
            <li>Any dispute between the RA and his client may be resolved through arbitration or through any other modes or mechanism as specified by SEBI</li>
          </ul>
        </Section>
        <Section id="additional" title="10. Additional clauses" icon={FileText}>
          <p>All additional voluntary clauses added by the RA should not be in contravention with rules/regulations/circulars of SEBI. Any changes in such voluntary clauses/document(s) shall be preceded by a notice of 15 days.</p>
        </Section>
        <Section id="notice" title="11. Mandatory notice" icon={AlertCircle}>
          <p>Clients shall be requested to go through Do's and Don'ts while dealing with RA as specified in SEBI master circular no. SEBI/HO/MIRSD-POD 1/P/CIR/2024/49 dated May 21, 2024 or as may be specified by SEBI from time to time.</p>
        </Section>
        <Section id="mitc" title="12. Most Important Terms and Conditions (MITC)" icon={AlertCircle} highlight={true}>
          <div className="space-y-2">
            <div className="bg-red-900/30 p-2 rounded-md">
              <h4 className="font-semibold text-red-300 mb-1 text-xs">Critical Notice:</h4>
              <p className="text-red-200 text-xs">These terms and conditions, and consent thereon are for the research services provided by the Research Analyst (RA) and RA cannot execute/carry out any trade (purchase/sell transaction) on behalf of, the client. Thus, the clients are advised not to permit RA to execute any trade on their behalf.</p>
            </div>
            <div className="bg-blue-900/30 p-2 rounded-md">
              <h4 className="font-semibold text-blue-300 mb-1 text-xs">Fee Structure:</h4>
              <ul className="list-disc list-inside space-y-1 text-blue-200">
                <li>Current fee limit is Rs 1,51,000/- per annum per family of client</li>
                <li>The fee limit does not include statutory charges</li>
                <li>The fee limits do not apply to a non-individual client / accredited investor</li>
              </ul>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <div className="bg-gray-700/50 p-2 rounded-md">
                <h4 className="font-semibold mb-1 text-xs text-gray-200">Payment Terms:</h4>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>RA may charge fees in advance (max one quarter)</li>
                  <li>Payment via cheque, online bank transfer, UPI, etc.</li>
                  <li>Cash payment is not allowed</li>
                  <li>Optional payment through CeFCoM managed by BSE Limited</li>
                </ul>
              </div>
              <div className="bg-gray-700/50 p-2 rounded-md">
                <h4 className="font-semibold mb-1 text-xs text-gray-200">Important Restrictions:</h4>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>No assured/guaranteed/fixed returns schemes</li>
                  <li>RA cannot guarantee returns, profits, accuracy</li>
                  <li>All investments subject to market risks</li>
                  <li>No recourse to claim losses</li>
                </ul>
              </div>
            </div>
            <div className="bg-yellow-900/30 p-2 rounded-md">
              <h4 className="font-semibold text-yellow-300 mb-1 text-xs">Grievance Resolution Process:</h4>
              <div className="space-y-1">
                <p className="text-xs"><strong>Step 1:</strong> Contact the RA using details on its website</p>
                <p className="text-xs"><strong>Step 2:</strong> Lodge grievances through SEBI's SCORES platform at www.scores.sebi.gov.in</p>
                <p className="text-xs"><strong>Step 3:</strong> Consider Online Dispute Resolution (ODR) through Smart ODR portal at https://smartodr.in</p>
              </div>
            </div>
            <div className="bg-red-900/30 p-2 rounded-md">
              <h4 className="font-semibold text-red-300 mb-1 text-xs">Security Warning:</h4>
              <p className="text-red-200 text-xs">The RA shall never ask for the client's login credentials and OTPs for the client's Trading Account, Demat Account and Bank Account. Never share such information with anyone including RA.</p>
            </div>
          </div>
        </Section>
        <Section id="cefcom" title="13. Optional Centralised Fee Collection Mechanism" icon={FileText}>
          <p>RA Shall provide the guidance to their clients on an optional 'Centralised Fee Collection Mechanism for IA and RA' (CeFCoM) available to them for payment of fees to RA.</p>
        </Section>
      </div>

      <div className="mt-6 p-3 bg-gray-800 rounded-md">
        <h3 className="font-semibold text-gray-100 mb-2 text-sm">Key Takeaways:</h3>
        <ul className="grid md:grid-cols-2 gap-1 text-xs">
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full mt-1 flex-shrink-0"></span>
            Maximum annual fee: ₹1.51 lakhs per family
          </li>
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full mt-1 flex-shrink-0"></span>
            No guaranteed returns or assurance
          </li>
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full mt-1 flex-shrink-0"></span>
            RA cannot execute trades on behalf of clients
          </li>
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full mt-1 flex-shrink-0"></span>
            All investments subject to market risks
          </li>
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full mt-1 flex-shrink-0"></span>
            Grievance resolution within 7 business days
          </li>
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full mt-1 flex-shrink-0"></span>
            Never share login credentials or OTPs
          </li>
        </ul>
      </div>
    </div>
    <div className="mt-10 flex text-xs text-zinc-500">
        <Footer_01 />
      </div>
    </>
  );
};

export default Page;