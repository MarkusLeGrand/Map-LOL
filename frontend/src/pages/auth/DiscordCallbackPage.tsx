import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { Header } from '../../components/layout/Header';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function DiscordCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Discord authentication...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth error
    if (error) {
      setStatus('error');
      setMessage(`Authentication failed: ${error}`);
      toast?.error(`Discord OAuth failed: ${error}`);
      setTimeout(() => navigate('/dashboard'), 3000);
      return;
    }

    // Check for required parameters
    if (!code || !state) {
      setStatus('error');
      setMessage('Missing authentication parameters');
      toast?.error('Invalid callback parameters');
      setTimeout(() => navigate('/dashboard'), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Call backend callback endpoint
      const response = await fetch(
        `${API_BASE_URL}/api/discord/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to authenticate with Discord');
      }

      const data = await response.json();

      setStatus('success');
      setMessage(`Successfully linked Discord account: ${data.discord.tag}`);
      toast?.success('Discord account linked successfully!');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to authenticate');
      toast?.error(error instanceof Error ? error.message : 'Authentication failed');
      setTimeout(() => navigate('/dashboard'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header
        brandName="OpenRift"
        tagline="PRO TOOLS FOR EVERYONE"
        showToolsLink={true}
      />

      <div className="flex-1 flex items-center justify-center py-16">
        <div className="max-w-md w-full mx-auto px-6">
          <div className="bg-[#F5F5F5]/[0.02] border border-[#F5F5F5]/10 rounded-lg p-8">
            {/* Status Icon */}
            <div className="flex justify-center mb-6">
              {status === 'loading' && (
                <div className="w-16 h-16 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
              )}
              {status === 'success' && (
                <div className="w-16 h-16 rounded-full bg-[#5865F2]/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-[#5865F2]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
              {status === 'error' && (
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Status Message */}
            <h2 className="text-[#F5F5F5] text-2xl font-semibold text-center mb-4">
              {status === 'loading' && 'Authenticating...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Error'}
            </h2>

            <p className="text-[#F5F5F5]/70 text-center mb-6">
              {message}
            </p>

            {status !== 'loading' && (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-4 py-3 bg-[#5865F2] text-[#F5F5F5] text-sm font-medium hover:bg-[#5865F2]/90 transition-colors rounded"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
