import React, { useState } from 'react';
import { useTranslationStore } from '../store';
import { Loader2 } from 'lucide-react';

import Spline from '@splinetool/react-spline';

const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GithubIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export function LoginView() {
  const [username, setUsernameInput] = useState('');
  const [email, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { setUser, setIsGuest } = useTranslationStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && email.trim()) {
      setIsLoading('email');
      setTimeout(() => {
        setUser(username.trim(), email.trim(), null);
      }, 800);
    }
  };

  const handleOAuthLogin = (providerName: string) => {
    setIsLoading(providerName);
    setTimeout(() => {
      setUser(`${providerName} User`, `user@${providerName.toLowerCase()}.com`, null);
    }, 1500);
  };

  const handleGuest = () => {
    setIsGuest(true);
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-white font-sans selection:bg-purple-500/30">
      {/* Left side - 3D Spline Interactive Background */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <div className="absolute inset-0 z-0">
          <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
        </div>
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
        <div className="absolute flex flex-col justify-center h-full p-20 z-10 pointer-events-none">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">
            Transify
          </h1>
          <p className="text-xl text-purple-200/80 max-w-md leading-relaxed">
            Break language barriers instantly. AI-powered translations wrapped in an immersive, beautiful experience.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 shadow-[0_0_40px_-10px_rgba(124,58,237,0.1)] relative overflow-hidden">
          
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

          <h2 className="text-3xl font-bold mb-2 text-white relative z-10">Welcome back</h2>
          <p className="text-slate-400 mb-8 relative z-10">Sign in to continue to Transify.</p>

          <form className="space-y-5 relative z-10" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={!!isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
            >
              {isLoading === 'email' ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign In'}
            </button>
          </form>

          <div className="my-8 flex items-center relative z-10">
            <div className="flex-grow h-px bg-slate-700/50"></div>
            <span className="px-4 text-sm text-slate-500">or continue with</span>
            <div className="flex-grow h-px bg-slate-700/50"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            <button 
              onClick={() => handleOAuthLogin('Google')}
              disabled={!!isLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-300 backdrop-blur-md disabled:opacity-50"
            >
              {isLoading === 'Google' ? <Loader2 className="animate-spin w-5 h-5" /> : <GoogleIcon size={20} />}
              <span className="text-sm font-medium">Google</span>
            </button>
            <button 
              onClick={() => handleOAuthLogin('GitHub')}
              disabled={!!isLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-300 backdrop-blur-md disabled:opacity-50"
            >
              {isLoading === 'GitHub' ? <Loader2 className="animate-spin w-5 h-5" /> : <GithubIcon size={20} />}
              <span className="text-sm font-medium">GitHub</span>
            </button>
          </div>
          
          <div className="mt-8 flex justify-center relative z-10">
             <button 
               onClick={handleGuest}
               className="text-sm text-slate-400 hover:text-white transition-colors"
             >
               Continue as Guest
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
