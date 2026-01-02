'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const auth = searchParams.get('auth');
    const token = searchParams.get('token');
    const message = searchParams.get('message');

    if (auth === 'success' && token) {
      // Send message to parent window (opener)
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'oauth-success',
            token,
          },
          window.location.origin
        );
      } else {
        // If not in popup, redirect to home with token
        window.location.href = `/?token=${token}`;
      }
    } else if (auth === 'error') {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'oauth-error',
            message: message || 'Authentication failed',
          },
          window.location.origin
        );
      } else {
        window.location.href = `/?auth_error=${encodeURIComponent(message || 'Authentication failed')}`;
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
