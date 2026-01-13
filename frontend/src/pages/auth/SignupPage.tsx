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
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 71 55">
                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
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
