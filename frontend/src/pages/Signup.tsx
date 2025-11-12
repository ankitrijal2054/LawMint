/**
 * Signup Page
 * Multi-step signup flow: Create account -> Choose firm action
 */

import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

type SignupStep = 'credentials' | 'firm-choice';
type FirmAction = 'create' | 'join' | null;

export function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  // Step 1: Credentials
  const [step, setStep] = useState<SignupStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Firm Choice
  const [firmAction, setFirmAction] = useState<FirmAction>(null);

  // Shared
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // =========================================================================
  // VALIDATORS
  // =========================================================================

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    return errors;
  };

  // =========================================================================
  // STEP 1: CREDENTIALS
  // =========================================================================

  const handleCredentialsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setLocalError(`Password must contain: ${passwordErrors.join(', ')}`);
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await signup(email, password, name);
      setStep('firm-choice');
    } catch (error: any) {
      const errorMessage =
        error.code === 'auth/email-already-in-use'
          ? 'Email already registered. Please log in instead.'
          : error.code === 'auth/invalid-email'
            ? 'Invalid email address'
            : error.code === 'auth/weak-password'
              ? 'Password is too weak'
              : error.message || 'Signup failed. Please try again.';

      setLocalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // STEP 2: FIRM CHOICE
  // =========================================================================

  const handleFirmChoice = (action: FirmAction) => {
    setFirmAction(action);
    if (action === 'create') {
      navigate('/create-firm');
    } else if (action === 'join') {
      navigate('/join-firm');
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

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
          {/* Progress Steps */}
          <div className="mb-8 flex items-center justify-center gap-2">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                step === 'credentials'
                  ? 'bg-blue-600 text-white'
                  : 'bg-green-600 text-white'
              }`}
            >
              {step === 'credentials' ? '1' : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div
              className={`w-12 h-1 transition-all ${
                step === 'firm-choice' ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                step === 'firm-choice'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-300 text-slate-600'
              }`}
            >
              2
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            {step === 'credentials' ? (
              <>
                {/* Step 1: Credentials */}
                <h1 className="text-3xl font-bold text-slate-900 mb-2 font-playfair">
                  Create Account
                </h1>
                <p className="text-slate-600 mb-8">Sign up to get started with LawMint</p>

                {/* Error Alert */}
                {localError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{localError}</p>
                  </div>
                )}

                <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      disabled={loading}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      disabled={loading}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Must be at least 8 characters with uppercase, lowercase, and numbers
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="flex items-start gap-3 text-sm text-slate-600">
                    <input type="checkbox" className="mt-1" disabled={loading} required />
                    <span>
                      I agree to the{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>
                    </span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </button>
                </form>

                {/* Login Link */}
                <p className="text-center text-slate-600 text-sm mt-6">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                    Sign In
                  </Link>
                </p>
              </>
            ) : (
              <>
                {/* Step 2: Firm Choice */}
                <h1 className="text-3xl font-bold text-slate-900 mb-2 font-playfair">
                  Choose Your Firm
                </h1>
                <p className="text-slate-600 mb-8">
                  Would you like to create a new firm or join an existing one?
                </p>

                <div className="space-y-4">
                  {/* Create Firm Option */}
                  <button
                    onClick={() => handleFirmChoice('create')}
                    className="w-full p-6 border-2 border-slate-300 hover:border-blue-600 rounded-xl transition-all text-left group hover:bg-blue-50"
                  >
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Create New Firm
                    </h3>
                    <p className="text-sm text-slate-600 mt-2">
                      Start fresh with your own firm. You'll get a unique firm code to share with your team.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-blue-600 font-semibold">
                      Continue <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Join Firm Option */}
                  <button
                    onClick={() => handleFirmChoice('join')}
                    className="w-full p-6 border-2 border-slate-300 hover:border-amber-600 rounded-xl transition-all text-left group hover:bg-amber-50"
                  >
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                      Join Existing Firm
                    </h3>
                    <p className="text-sm text-slate-600 mt-2">
                      Join a firm with an existing firm code. You'll need the code from your firm administrator.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-amber-600 font-semibold">
                      Continue <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                </div>

                {/* Back Button */}
                <button
                  onClick={() => setStep('credentials')}
                  className="w-full mt-6 py-3 border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-lg transition-all"
                >
                  Back
                </button>
              </>
            )}
          </div>

          {/* Footer Text 
          <p className="text-center text-slate-600 text-xs mt-8">
            Need help?{' '}
            <a href="mailto:support@lawmint.com" className="text-blue-600 hover:underline">
              Contact support
            </a>
          </p>*/}
        </div>
      </div>
    </div>
  );
}

