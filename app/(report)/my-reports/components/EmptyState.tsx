import Link from 'next/link';
import { FileText } from 'lucide-react';
import { ShinyButton } from '@/components/magicui/shiny-button';

export default function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-xl">
      <div className="mx-auto w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-6">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-4">
        No Reports Yet
      </h2>
      <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
        You haven't generated any reports yet. Create your first research report to see it here.
      </p>
      <Link href="/report-gen">
        <ShinyButton className="text-lg px-8 py-4 gap-3">
          <FileText className="h-5 w-5" />
          Generate Your First Report
        </ShinyButton>
      </Link>
    </div>
  );
}
