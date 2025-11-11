/**
 * Create Firm Form Component
 * Allows users to create a new firm and receive a unique firm code
 */

import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, ArrowRight, Copy, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateFirmFormProps {
  onSuccess?: (firmId: string, firmCode: string) => void;
}

export function CreateFirmForm({ onSuccess }: CreateFirmFormProps) {
  const navigate = useNavigate();
  const { createFirm, loading } = useAuth();

  const [firmName, setFirmName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [result, setResult] = useState<{ firmId: string; firmCode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    if (!firmName.trim()) {
      setLocalError('Please enter a firm name');
      return;
    }

    if (firmName.length < 2) {
      setLocalError('Firm name must be at least 2 characters');
      return;
    }

    try {
      const { firmId, firmCode } = await createFirm(firmName);
      setResult({ firmId, firmCode });

      if (onSuccess) {
        onSuccess(firmId, firmCode);
      }
    } catch (error: any) {
      setLocalError(error.message || 'Failed to create firm');
    }
  };

  const handleCopyCode = () => {
    if (result?.firmCode) {
      navigator.clipboard.writeText(result.firmCode);
      setCopied(true);
      toast.success('Firm code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  // If successful, show confirmation
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-amber-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 font-playfair">LawMint</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            {/* Success Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>

              <h1 className="text-3xl font-bold text-slate-900 mb-2 font-playfair">
                Firm Created!
              </h1>
              <p className="text-slate-600 mb-8">
                Your firm has been successfully created. Share your firm code with team members to invite them.
              </p>

              {/* Firm Code Display */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 mb-8">
                <p className="text-sm text-slate-600 mb-2">Your Firm Code</p>
                <p className="text-4xl font-bold text-blue-600 font-mono mb-4">{result.firmCode}</p>
                <button
                  onClick={handleCopyCode}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" /> Copy Code
                    </>
                  )}
                </button>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
                <h3 className="font-semibold text-slate-900 mb-3">Next Steps</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-blue-600 mt-0.5">1</span>
                    <span>Share your firm code with team members</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-blue-600 mt-0.5">2</span>
                    <span>They can join using the code during signup</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-blue-600 mt-0.5">3</span>
                    <span>Manage your team from the admin dashboard</span>
                  </li>
                </ul>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-amber-500 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 font-playfair">LawMint</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 font-playfair">
              Create Your Firm
            </h1>
            <p className="text-slate-600 mb-8">Set up your law firm to start collaborating with your team</p>

            {/* Error Alert */}
            {localError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{localError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Firm Name */}
              <div>
                <label htmlFor="firmName" className="block text-sm font-medium text-slate-700 mb-2">
                  Firm Name
                </label>
                <input
                  id="firmName"
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="e.g., Smith & Associates LLP"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 mt-2">
                  This is your firm's official name shown to all team members
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-blue-900">💡 Pro Tip:</span> After creation,
                  you'll receive a unique firm code to share with your team members.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Firm...' : 'Create Firm'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="w-full py-3 border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-lg transition-all"
              >
                Back
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

