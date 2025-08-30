import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Ask Alpha Terms & Conditions",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 prose prose-invert">
      <h1>Ask Alpha – Terms & Conditions</h1>

      <h2>1. Introduction</h2>
      <p>
        Welcome to Ask Alpha (“we,” “our,” “us”). By using our website, platform, or services, you agree to these Terms & Conditions.
        Please read them carefully before using Ask Alpha. If you do not agree, you should not use our services.
      </p>

      <h2>2. Nature of Services</h2>
      <p>
        Ask Alpha provides AI-powered tools for stock market research, including recommendations, screeners, charts, and analysis features.
        Our services are for informational and educational purposes only. We are not a SEBI-registered investment advisor, broker, or research analyst.
        Nothing on our platform should be considered financial advice.
      </p>

      <h2>3. User Responsibilities</h2>
      <ul>
        <li>You are responsible for any investment decisions you make.</li>
        <li>You agree not to misuse our platform, attempt to manipulate data, or use automated systems to overload our services.</li>
        <li>You confirm that you are above 18 years of age and legally capable of entering into this agreement.</li>
      </ul>

      <h2>4. Accuracy of Information</h2>
      <p>
        While we strive to provide accurate and timely information, Ask Alpha does not guarantee the accuracy, completeness, or reliability of any content, recommendation, or analysis.
        Markets are dynamic and subject to risks.
      </p>

      <h2>5. Limitations of Liability</h2>
      <p>
        Ask Alpha shall not be liable for any direct, indirect, incidental, or consequential losses, including financial loss, arising from the use of our services.
      </p>

      <h2>6. Intellectual Property</h2>
      <p>
        All content, software, design, and features on Ask Alpha belong to us or our licensors. You may not copy, reproduce, or distribute any part of the platform without permission.
      </p>

      <h2>7. Termination</h2>
      <p>
        We reserve the right to suspend or terminate accounts if we detect misuse, fraudulent activity, or violation of these terms.
      </p>

      <h2>8. Governing Law</h2>
      <p>
        These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the jurisdiction of the courts in Mumbai, Maharashtra.
      </p>
    </div>
  );
}


