/**
 * Landing Page
 * Welcome page with hero section, features, and CTA
 * Steno-inspired design with professional aesthetic
 */

import { useNavigate } from 'react-router-dom';
import { FileText, Users, Zap, Lock, ArrowRight } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Generation',
      description: 'Generate professional demand letters in seconds using OpenAI',
    },
    {
      icon: Users,
      title: 'Real-Time Collaboration',
      description: 'Work together with your team on documents simultaneously',
    },
    {
      icon: FileText,
      title: 'Professional Export',
      description: 'Export to polished DOCX format with perfect formatting',
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'Enterprise-grade security for your legal documents',
    },
  ];

  const benefits = [
    'Save 50%+ time on document drafting',
    'Maintain consistency across documents',
    'Collaborate securely with team members',
    'Professional formatting out of the box',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-8 h-8 text-amber-400" />
            <span className="text-xl font-bold text-white font-playfair">LawMint</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 text-slate-200 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        {/* Decorative elements */}
        <div className="absolute inset-0 -z-10 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-playfair leading-tight">
            AI-Powered Demand Letters for Modern Law Firms
          </h1>

          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Draft, refine, and collaborate on demand letters securely and effortlessly. Transform how your firm
            creates legal documents with intelligent automation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg flex items-center gap-2 transition-all transform hover:scale-105"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Sign In
            </button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Enterprise Security
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              SOC 2 Compliant
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              ISO 27001 Ready
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-playfair">
            Everything you need to manage legal documents
          </h2>
          <p className="text-lg text-slate-300">Powerful features designed for law firms</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-amber-500 transition-all hover:bg-slate-800 group"
              >
                <Icon className="w-12 h-12 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-blue-900/20 to-amber-900/20 border-y border-slate-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6 font-playfair">
                Why law firms choose LawMint
              </h2>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-lg text-slate-200">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-900/30 to-amber-900/30 border border-slate-700 rounded-2xl p-8">
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-400">Average Time Saved</p>
                  <p className="text-3xl font-bold text-amber-400">50%+</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-400">Template Library</p>
                  <p className="text-3xl font-bold text-amber-400">10</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-400">Firms Using LawMint</p>
                  <p className="text-3xl font-bold text-amber-400">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-playfair">
          Ready to transform your document workflow?
        </h2>
        <p className="text-lg text-slate-300 mb-8">Start drafting smarter demand letters today</p>
        <button
          onClick={() => navigate('/signup')}
          className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 inline-flex items-center gap-2"
        >
          Get Started Free <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400 text-sm">
          <p>&copy; 2024 LawMint. All rights reserved. Crafted for modern law firms.</p>
        </div>
      </footer>
    </div>
  );
}

