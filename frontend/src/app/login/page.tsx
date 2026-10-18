'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { loginWithGoogle } from '@/lib/api/auth';
import { AlertCircle } from 'lucide-react';

const GOOGLE_CLIENT_ID =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '160156035669-dqgggnb33uongpp7raa8jfam4rrm0c56.apps.googleusercontent.com';

function LoginContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const triggerGooglePopup = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setErrorMsg('');
            try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleUser = await userInfoRes.json();

                if (!googleUser.email) {
                    throw new Error('Could not retrieve email from Google account.');
                }

                await loginWithGoogle({
                    email: googleUser.email,
                    name: googleUser.name || googleUser.given_name || googleUser.email.split('@')[0],
                    avatar: googleUser.picture,
                    idToken: tokenResponse.access_token,
                });

                router.push('/dashboard/scheduled');
            } catch (err: any) {
                console.error('Google OAuth error:', err);
                setErrorMsg('Google login failed. Please try selecting your account again.');
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setErrorMsg('Google Sign-In was cancelled or failed.');
            setLoading(false);
        },
        prompt: 'select_account',
    });

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        try {
            await loginWithGoogle({
                email: email || 'oliver.brown@domain.io',
                name: email ? email.split('@')[0] : 'Oliver Brown',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            });
            router.push('/dashboard/scheduled');
        } catch {
            setErrorMsg('Failed to sign in. Please verify your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center items-center p-4 font-sans text-gray-900">
            <div className="w-full max-w-[400px] p-8 sm:p-9 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.04)] text-center">
                {/* Title matching Figma */}
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Login</h1>

                {errorMsg && (
                    <div className="mb-4 bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-200 text-xs flex items-center space-x-2 text-left">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Login with Google Button matching Figma */}
                <button
                    type="button"
                    onClick={() => triggerGooglePopup()}
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 rounded-lg bg-[#e6f4ea] hover:bg-[#d8eedd] text-gray-800 font-medium text-xs transition-colors border border-[#cbe8d2] active:scale-[0.99]"
                >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                    </svg>
                    <span>{loading ? 'Signing in...' : 'Login with Google'}</span>
                </button>

                {/* Divider matching Figma */}
                <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-100" />
                    </div>
                    <div className="relative flex justify-center text-[11px]">
                        <span className="bg-white px-2.5 text-gray-400 font-normal">
                            or sign up through email
                        </span>
                    </div>
                </div>

                {/* Email & Password Form matching Figma */}
                <form onSubmit={handleEmailLogin} className="space-y-3">
                    <div>
                        <input
                            type="email"
                            placeholder="Email ID"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#f1f3f4] text-gray-900 placeholder-gray-400 text-xs border border-transparent focus:border-[#00a854] focus:bg-white focus:outline-none transition-all"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#f1f3f4] text-gray-900 placeholder-gray-400 text-xs border border-transparent focus:border-[#00a854] focus:bg-white focus:outline-none transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#00a854] hover:bg-[#00875a] text-white font-semibold text-xs transition-colors shadow-sm active:scale-[0.99] disabled:opacity-60"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {/* Invisible Google OneTap helper */}
                <div className="mt-4 hidden">
                    <GoogleLogin
                        onSuccess={async (cred) => {
                            if (cred.credential) {
                                const base64Url = cred.credential.split('.')[1];
                                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                                const jsonPayload = decodeURIComponent(
                                    atob(base64)
                                        .split('')
                                        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                                        .join('')
                                );
                                const user = JSON.parse(jsonPayload);
                                await loginWithGoogle({
                                    email: user.email,
                                    name: user.name,
                                    avatar: user.picture,
                                    idToken: cred.credential,
                                });
                                router.push('/dashboard/scheduled');
                            }
                        }}
                        onError={() => {}}
                    />
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <LoginContent />
        </GoogleOAuthProvider>
    );
}
