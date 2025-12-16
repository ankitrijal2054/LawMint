/**
 * FirmCodeCard Component
 * Displays firm code with copy functionality for the Admin Dashboard
 */

import { useState } from 'react';
import { Copy, CheckCircle2, Building } from 'lucide-react';
import toast from 'react-hot-toast';

interface FirmCodeCardProps {
  firmCode?: string;
}

export function FirmCodeCard({ firmCode }: FirmCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (firmCode) {
      navigator.clipboard.writeText(firmCode);
      setCopied(true);
      toast.success('Firm code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Building className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Firm Code</h3>
      </div>

      <p className="text-sm text-slate-600 mb-4">
        Share this code with new team members to join your firm.
      </p>

      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <span className="text-2xl font-mono font-bold text-blue-600 flex-1">
          {firmCode || '------'}
        </span>
        <button
          onClick={handleCopy}
          disabled={!firmCode}
          className="p-2 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Copy firm code"
        >
          {copied ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Copy className="w-5 h-5 text-slate-600" />
          )}
        </button>
      </div>
    </div>
  );
}
