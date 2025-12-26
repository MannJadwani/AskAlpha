import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Ask Alpha Terms & Conditions - Annexure B",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 prose prose-invert">
      <h1>Terms & Conditions</h1>

      <h2>ANNEXURE-B</h2>
      <h3>Disclosure of minimum mandatory terms and conditions to clients</h3>

      <p>
        RAs shall disclose to the client the terms and conditions of the research services offered including rights and obligations. RAs shall ensure that neither any research service is rendered nor any fee is charged until consent is received from the client on the terms and conditions.
      </p>

      <p>
        By accepting delivery of the research service, the client confirms that he/she has elected to subscribe the research service of the RA at his/her sole discretion. RA confirms that research services shall be rendered in accordance with the applicable provisions of the RA Regulations.
      </p>

      <p>
        RA and client shall be bound by SEBI Act and all the applicable rules and regulations of SEBI, including the RA Regulations and relevant notifications of Government, as may be in force, from time to time.
      </p>

      <p>
        The client shall furnish all such details in full as may be required by the RA in its standard form with supporting details, if required, as may be made mandatory by RAASB/SEBI from time to time. RA shall collect, store, upload and check KYC records of the clients with KYC Registration Agency (KRA) as specified by SEBI from time to time.
      </p>

      <h3>Client Consent Statement:</h3>
      <div className="pl-4 border-l-4 border-gray-600 italic my-4">
        <p>
          "I / We have read and understood the terms and conditions applicable to a research analyst as defined under regulation 2(1)(u) of the SEBI (Research Analyst) Regulations, 2014, including the fee structure.
        </p>
        <p>
          I/We are subscribing to the research services for our own benefits and consumption, and any reliance placed on the research report provided by research analyst shall be as per our own judgement and assessment of the conclusions contained in the research report.
      </p>
        <p>
          I/We understand that --
        </p>
        <ul className="list-disc pl-5">
          <li>Any investment made based on the recommendations in the research report are subject to market risk.</li>
          <li>Recommendations in the research report do not provide any assurance of returns.</li>
          <li>There is no recourse to claim any losses incurred on the investments made based on the recommendations in the research report."</li>
        </ul>
      </div>

      <h3>RA Declaration:</h3>
      <ul className="list-disc pl-5">
        <li>It is duly registered with SEBI as an RA pursuant to the SEBI (Research Analysts) Regulations, 2014</li>
        <li>It has registration and qualifications required to render the services contemplated under the RA Regulations</li>
        <li>Research analyst services provided by it do not conflict with or violate any provision of law</li>
        <li>The maximum fee that may be charged by RA is ₹1.51 lakhs per annum per family of client</li>
        <li>The recommendations provided by RA do not provide any assurance of returns</li>
      </ul>

      <p>
        The client shall duly pay to RA, the agreed fees for the services that RA renders to the client and statutory charges, as applicable. Such fees and statutory charges shall be payable through the specified manner and mode(s)/mechanism(s).
      </p>

      <p>
        <em>(A statement covering the standard risks associated with investment in securities to be added under this clause by the RA)</em>
      </p>

      <p>
        The RA shall adhere to the applicable regulations/circulars/directions specified by SEBI from time to time in relation to disclosure and mitigation of any actual or potential conflict of interest. <em>(A statement covering the mandatory disclosures to be added under this clause by the RA.)</em>
      </p>

      <p>
        Disclosure that the RA may suspend or terminate rendering of research services to client on account of suspension/cancellation of registration of RA by SEBI and shall refund the residual amount to the client.
      </p>

      <p>
        In case of suspension of certificate of registration of the RA for more than 60 (sixty) days or cancellation of the RA registration, RA shall refund the fees, on a pro rata basis for the period from the effective date of cancellation/suspension to end of the subscription period.
      </p>

      <p>
        Any grievance related to (i) non receipt of research report or (ii) missing pages or inability to download the entire report, or (iii) any other deficiency in the research services provided by RA, shall be escalated promptly by the client to the person/employee designated by RA.
      </p>

      <ul className="list-disc pl-5">
        <li>The RA shall be responsible to resolve grievances within 7 (seven) business working days</li>
        <li>RA shall redress grievances of the client in a timely and transparent manner</li>
        <li>Any dispute between the RA and his client may be resolved through arbitration or through any other modes or mechanism as specified by SEBI</li>
      </ul>

      <p>
        All additional voluntary clauses added by the RA should not be in contravention with rules/regulations/circulars of SEBI. Any changes in such voluntary clauses/document(s) shall be preceded by a notice of 15 days.
      </p>

      <p>
        Clients shall be requested to go through Do's and Don'ts while dealing with RA as specified in SEBI master circular no. SEBI/HO/MIRSD-POD 1/P/CIR/2024/49 dated May 21, 2024 or as may be specified by SEBI from time to time.
      </p>

      <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-md my-6">
        <h3 className="mt-0 text-yellow-500">Critical Notice:</h3>
        <p className="mb-0">
          These terms and conditions, and consent thereon are for the research services provided by the Research Analyst (RA) and RA cannot execute/carry out any trade (purchase/sell transaction) on behalf of, the client. Thus, the clients are advised not to permit RA to execute any trade on their behalf.
        </p>
      </div>

      <h3>Fee Structure:</h3>
      <ul className="list-disc pl-5">
        <li>Current fee limit is Rs 1,51,000/- per annum per family of client</li>
        <li>The fee limit does not include statutory charges</li>
        <li>The fee limits do not apply to a non-individual client / accredited investor</li>
      </ul>

      <h3>Payment Terms:</h3>
      <ul className="list-disc pl-5">
        <li>RA may charge fees in advance (max one quarter)</li>
        <li>Payment via cheque, online bank transfer, UPI, etc.</li>
        <li>Cash payment is not allowed</li>
        <li>Optional payment through CeFCoM managed by BSE Limited</li>
      </ul>

      <h3>Important Restrictions:</h3>
      <ul className="list-disc pl-5">
        <li>No assured/guaranteed/fixed returns schemes</li>
        <li>RA cannot guarantee returns, profits, accuracy</li>
        <li>All investments subject to market risks</li>
        <li>No recourse to claim losses</li>
      </ul>

      <h3>Grievance Resolution Process:</h3>
      <ol className="list-decimal pl-5">
        <li><strong>Step 1:</strong> Contact the RA using details on its website</li>
        <li><strong>Step 2:</strong> Lodge grievances through SEBI's SCORES platform at <a href="http://www.scores.sebi.gov.in" target="_blank" rel="noopener noreferrer">www.scores.sebi.gov.in</a></li>
        <li><strong>Step 3:</strong> Consider Online Dispute Resolution (ODR) through Smart ODR portal at <a href="https://smartodr.in" target="_blank" rel="noopener noreferrer">https://smartodr.in</a></li>
      </ol>

      <h3>Security Warning:</h3>
      <p>
        The RA shall never ask for the client's login credentials and OTPs for the client's Trading Account, Demat Account and Bank Account. Never share such information with anyone including RA.
      </p>
      <p>
        RA Shall provide the guidance to their clients on an optional 'Centralised Fee Collection Mechanism for IA and RA' (CeFCoM) available to them for payment of fees to RA.
      </p>

      <h3>Key Takeaways:</h3>
      <ul className="list-disc pl-5">
        <li>Maximum annual fee: ₹1.51 lakhs per family</li>
        <li>No guaranteed returns or assurance</li>
        <li>RA cannot execute trades on behalf of clients</li>
        <li>All investments subject to market risks</li>
        <li>Grievance resolution within 7 business days</li>
        <li>Never share login credentials or OTPs</li>
      </ul>
    </div>
  );
}
