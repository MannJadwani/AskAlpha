import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Ask Alpha Disclaimer",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 prose prose-invert">
      <h1>Ask Alpha – Disclaimer</h1>
      <p>Ask Alpha is an AI-powered stock research tool.</p>
      <p>We are not registered with SEBI as an investment advisor or research analyst.</p>
      <p>The recommendations and insights generated are for educational and informational purposes only.</p>
      <p>Any investment decision you make is entirely at your own risk. Please consult a qualified financial advisor before making investment decisions.</p>
      <p>Past performance does not guarantee future results. Stock markets are inherently risky.</p>
    </div>
  );
}


