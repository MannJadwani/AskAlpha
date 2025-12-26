import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  error: string;
}

export default function ErrorAlert({ error }: ErrorAlertProps) {
  return (
    <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-6">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-red-400 mb-1">Error</h3>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      </div>
    </div>
  );
}
