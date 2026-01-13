import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { verifyRiotAccount } from '../../services/riotApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [riotId, setRiotId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Parse Riot ID if provided
    let riotGameName: string | undefined;
    let riotTagLine: string | undefined;

    if (riotId.trim()) {
      if (!riotId.includes('#')) {
        setError('Invalid Riot ID format. Use: GameName#TAG');
        return;
      }
      const parts = riotId.split('#');
      riotGameName = parts[0].trim();
      riotTagLine = parts[1].trim();

      if (!riotGameName || !riotTagLine) {
        setError('Invalid Riot ID format. Use: GameName#TAG');
        return;
      }

    }

    setIsLoading(true);
    setError('');

    try {
      await register(
        email,
        username,
        password,
        riotGameName,
        riotTagLine,
        undefined // Discord is now managed via OAuth in Settings
      );

      // After registration, verify Riot account if provided
      if (riotGameName && riotTagLine) {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            setError('Verifying Riot account...');
            await verifyRiotAccount(token, riotGameName, riotTagLine, 'EUW1', 'europe');
          }
        } catch (verifyError) {
          // Show error but don't fail registration
          setError('Account created but Riot ID verification failed. Please verify it in Settings.');
          setIsLoading(false);
          setTimeout(() => navigate('/dashboard'), 3000);
          return;
        }
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordSignup = async () => {
    setDiscordLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/discord/login/authorize`);

      if (!response.ok) {
        throw new Error('Failed to get Discord authorization URL');
      }

      const data = await response.json();
      window.location.href = data.authorization_url;
    } catch (error) {

      setError('Failed to connect to Discord');
      setDiscordLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header
        brandName="OpenRift"
        tagline="PRO TOOLS FOR EVERYONE"
        showToolsLink={true}
      />

      <div className="flex-1 flex items-center justify-center py-16">
        <div className="w-full max-w-md px-8">
          <div className="bg-[#1a1a1a] border border-[#F5F5F5]/10 p-8">
            <h1 className="text-[#F5F5F5] text-3xl font-semibold mb-2">Create Account</h1>
            <p className="text-[#F5F5F5]/50 mb-8">Join OpenRift and start tracking your performance</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#F5F5F5]/70 text-sm mb-2">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#0E0E0E] border border-[#F5F5F5]/20 text-[#F5F5F5] px-4 py-2.5 focus:outline-none focus:border-[#F5F5F5]/40"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-[#F5F5F5]/70 text-sm mb-2">Username *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-[#0E0E0E] border border-[#F5F5F5]/20 text-[#F5F5F5] px-4 py-2.5 focus:outline-none focus:border-[#F5F5F5]/40"
                  placeholder="YourUsername"
                />
              </div>

              <div>
                <label className="block text-[#F5F5F5]/70 text-sm mb-2">Riot ID (optional)</label>
                <input
                  type="text"
                  value={riotId}
                  onChange={(e) => setRiotId(e.target.value)}
                  className="w-full bg-[#0E0E0E] border border-[#F5F5F5]/20 text-[#F5F5F5] px-4 py-2.5 focus:outline-none focus:border-[#F5F5F5]/40"
                  placeholder="Faker#KR1"
                />
                <p className="text-[#F5F5F5]/40 text-xs mt-2">Format: GameName#TAG (ex: Faker#KR1)</p>
              </div>

              <div>
                <label className="block text-[#F5F5F5]/70 text-sm mb-2">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#0E0E0E] border border-[#F5F5F5]/20 text-[#F5F5F5] px-4 py-2.5 focus:outline-none focus:border-[#F5F5F5]/40"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[#F5F5F5]/70 text-sm mb-2">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-[#0E0E0E] border border-[#F5F5F5]/20 text-[#F5F5F5] px-4 py-2.5 focus:outline-none focus:border-[#F5F5F5]/40"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#F5F5F5] text-[#0E0E0E] font-medium py-3 hover:bg-[#F5F5F5]/90 transition-colors disabled:opacity-50 mt-6"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-[#F5F5F5]/10"></div>
              <span className="px-4 text-[#F5F5F5]/50 text-sm">OR</span>
              <div className="flex-1 border-t border-[#F5F5F5]/10"></div>
            </div>

            {/* Discord Signup Button */}
            <button
              onClick={handleDiscordSignup}
              disabled={discordLoading}
              className="w-full px-4 py-3 bg-[#5865F2] text-[#F5F5F5] font-medium hover:bg-[#5865F2]/90 transition-colors rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {discordLoading ? (
                'Connecting...'
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                  Sign up with Discord
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              <p className="text-[#F5F5F5]/50 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-[#F5F5F5] hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer
        copyright="© 2025 OpenRift — Professional Tools Platform"
        links={[
          { label: 'About', href: '/about' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
        ]}
      />
    </div>
  );
}
