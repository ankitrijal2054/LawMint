/**
 * Join Firm Form Component
 * Allows users to join an existing firm using a firm code
 * IMPORTANT: This creates the Firebase account AND joins firm atomically
 */

import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { SignupCredentials } from '@/pages/Signup';

interface JoinFirmFormProps {
  onSuccess?: (firmId: string) => void;
}

export function JoinFirmForm({ onSuccess }: JoinFirmFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signupAndJoinFirm, loading } = useAuth();

  // Get credentials from navigation state
  const credentials = (location.state as { credentials?: SignupCredentials })?.credentials;

  const [firmCode, setFirmCode] = useState('');
  const [role, setRole] = useState<'lawyer' | 'paralegal'>('lawyer');
  const [localError, setLocalError] = useState<string | null>(null);
  const [result, setResult] = useState<{ firmId: string } | null>(null);

  // Redirect if no credentials provided
  useEffect(() => {
    if (!credentials) {
      toast.error('Please complete signup first');
      navigate('/signup');
    }
  }, [credentials, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    if (!credentials) {
      setLocalError('Missing signup credentials. Please restart signup process.');
      return;
    }

    if (!firmCode.trim()) {
      setLocalError('Please enter a firm code');
      return;
    }

    // Validate firm code format (should be LAWMINT-XXXXX)
    const firmCodeRegex = /^LAWMINT-[A-Z0-9]{5}$/;
    if (!firmCodeRegex.test(firmCode.toUpperCase())) {
      setLocalError('Invalid firm code format. Please check and try again.');
      return;
    }

    if (!role) {
      setLocalError('Please select your role');
      return;
    }

    try {
      // Create account AND join firm atomically
      const { firmId } = await signupAndJoinFirm(
        credentials.email,
        credentials.password,
        credentials.name,
        firmCode.toUpperCase(),
        role
      );
      setResult({ firmId });

      if (onSuccess) {
        onSuccess(firmId);
      }
    } catch (error: any) {
      const errorMessage =
        error.code === 'auth/email-already-in-use'
          ? 'Email already registered. Please log in instead.'
          : error.code === 'auth/invalid-email'
            ? 'Invalid email address'
            : error.code === 'auth/weak-password'
              ? 'Password is too weak'
            : error.message?.includes('Invalid firm code')
              ? 'Invalid firm code. Please check with your firm administrator.'
              : error.message?.includes('already a member')
                ? 'You are already a member of this firm.'
                : error.message || 'Failed to create account and join firm';

      setLocalError(errorMessage);
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
                Welcome to the Firm!
              </h1>
              <p className="text-slate-600 mb-8">
                You've successfully joined your firm. You can now start collaborating with your team on documents.
              </p>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
                <h3 className="font-semibold text-slate-900 mb-3">You're all set!</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-blue-600 mt-0.5">✓</span>
                    <span>Your role: <span className="font-semibold capitalize">{role}</span></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-blue-600 mt-0.5">✓</span>
                    <span>Access firm templates and documents</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-blue-600 mt-0.5">✓</span>
                    <span>Collaborate with team members in real-time</span>
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
              Join Your Firm
            </h1>
            <p className="text-slate-600 mb-8">
              Enter your firm code to join your organization
            </p>

            {/* Error Alert */}
            {localError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{localError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Firm Code */}
              <div>
                <label htmlFor="firmCode" className="block text-sm font-medium text-slate-700 mb-2">
                  Firm Code
                </label>
                <input
                  id="firmCode"
                  type="text"
                  value={firmCode}
                  onChange={(e) => setFirmCode(e.target.value.toUpperCase())}
                  placeholder="LAWMINT-XXXXX"
                  maxLength={13}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-center text-lg"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Ask your firm administrator for the firm code (format: LAWMINT-XXXXX)
                </p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Your Role</label>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-slate-300 rounded-lg hover:border-blue-500 cursor-pointer transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="role"
                      value="lawyer"
                      checked={role === 'lawyer'}
                      onChange={(e) => setRole(e.target.value as 'lawyer' | 'paralegal')}
                      className="w-5 h-5"
                      disabled={loading}
                    />
                    <div className="ml-3">
                      <p className="font-semibold text-slate-900">Lawyer</p>
                      <p className="text-sm text-slate-600">Can create and edit documents</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-slate-300 rounded-lg hover:border-blue-500 cursor-pointer transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="role"
                      value="paralegal"
                      checked={role === 'paralegal'}
                      onChange={(e) => setRole(e.target.value as 'lawyer' | 'paralegal')}
                      className="w-5 h-5"
                      disabled={loading}
                    />
                    <div className="ml-3">
                      <p className="font-semibold text-slate-900">Paralegal</p>
                      <p className="text-sm text-slate-600">Can create and collaborate on documents</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Joining Firm...' : 'Create Account and Join Firm'}
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

