import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - AI Stock Analysis Insights & Market Research",
  description: "Expert insights on AI-powered stock analysis, market research, investment strategies, and financial technology. Stay updated with the latest trends in equity research and trading.",
  keywords: [
    "AI stock analysis blog",
    "investment research insights",
    "market analysis articles",
    "trading strategies blog",
    "financial technology insights",
    "equity research blog",
    "stock market analysis",
    "investment blog"
  ],
  openGraph: {
    title: "Blog - AI Stock Analysis Insights & Market Research",
    description: "Expert insights on AI-powered stock analysis, market research, and investment strategies.",
    url: "/blog",
    siteName: "AskAlpha",
    images: [{ url: "/assets/app.png", width: 1200, height: 630, alt: "AskAlpha Blog" }],
    locale: "en_US",
    type: "website",
  },
  alternates: { canonical: "/blog" },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
