export default function InlineDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-white/60 ${className}`}>
      This is AI-generated research for informational purposes only. Not investment advice.
    </p>
  );
}


