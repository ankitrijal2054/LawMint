/**
 * ApiKeyConfigCard Component
 * Allows admin to configure firm's OpenAI API key
 */

import { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useFirmSettings, useSetApiKey } from '@/hooks/useFirmSettings';
import toast from 'react-hot-toast';

export function ApiKeyConfigCard() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useFirmSettings();
  const setApiKeyMutation = useSetApiKey();

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      toast.error('Invalid API key format. OpenAI keys start with "sk-"');
      return;
    }

    try {
      await setApiKeyMutation.mutateAsync({ apiKey });
      toast.success('API key configured successfully');
      setApiKey(''); // Clear input after successful save
    } catch (error: any) {
      toast.error(error.message || 'Failed to save API key');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
          <Key className="w-5 h-5 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">OpenAI API Key</h3>
      </div>

      {/* Status Indicator */}
      {settingsLoading ? (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-4 bg-slate-50 border border-slate-200">
          <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
          <span className="text-sm text-slate-600">Checking configuration...</span>
        </div>
      ) : (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
            settings?.hasOpenAIKey
              ? 'bg-green-50 border border-green-200'
              : 'bg-amber-50 border border-amber-200'
          }`}
        >
          {settings?.hasOpenAIKey ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">API key is configured</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-800">
                No API key configured - AI features disabled
              </span>
            </>
          )}
        </div>
      )}

      <p className="text-sm text-slate-600 mb-4">
        Enter your OpenAI API key to enable AI-powered document generation and refinement.
        The key will be encrypted and stored securely.
      </p>

      {/* Input Field */}
      <div className="relative mb-4">
        <input
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full px-4 py-2 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {/* Help Text */}
      <p className="text-xs text-slate-500 mb-4">
        Get your API key from{' '}
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          OpenAI Dashboard
        </a>
      </p>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!apiKey.trim() || setApiKeyMutation.isPending}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        {setApiKeyMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Validating & Saving...</span>
          </>
        ) : (
          <span>{settings?.hasOpenAIKey ? 'Update API Key' : 'Save API Key'}</span>
        )}
      </button>
    </div>
  );
}
