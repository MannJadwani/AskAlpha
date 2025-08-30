import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Ask Alpha Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 prose prose-invert">
      <h1>Ask Alpha – Privacy Policy</h1>

      <h2>1. Information We Collect</h2>
      <ul>
        <li>Personal details you provide when signing up (name, email, etc.)</li>
        <li>Usage data such as queries, stock searches, and recommendations viewed</li>
        <li>Optional data such as uploaded documents (e.g., annual reports)</li>
      </ul>

      <h2>2. How We Use Information</h2>
      <ul>
        <li>To provide and improve our services</li>
        <li>To personalize your experience with recommendations and insights</li>
        <li>To send updates, alerts, or research-related communication (you can opt out)</li>
      </ul>

      <h2>3. Data Sharing</h2>
      <ul>
        <li>We do not sell your data.</li>
        <li>Data may be shared with trusted third-party service providers (for hosting, analytics, or compliance).</li>
        <li>If legally required, we may share information with regulators or authorities.</li>
      </ul>

      <h2>4. Security</h2>
      <p>
        We use encryption, secure servers, and best practices to safeguard your data. However, no system is completely secure, and we cannot guarantee absolute protection.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We keep your data for as long as your account is active, or as required by law. You may request deletion of your account and related data at any time.
      </p>

      <h2>6. Your Rights</h2>
      <ul>
        <li>Access your data</li>
        <li>Request corrections</li>
        <li>Request deletion (subject to legal obligations)</li>
        <li>Opt out of marketing communications</li>
      </ul>

      <h2>7. Updates to Policy</h2>
      <p>
        We may update this policy to reflect changes in technology, law, or services. Significant updates will be notified via email or the platform.
      </p>
    </div>
  );
}


