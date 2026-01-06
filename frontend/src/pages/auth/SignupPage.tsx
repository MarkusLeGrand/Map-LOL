import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [riotId, setRiotId] = useState('');
  const [discord, setDiscord] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    try {
      await register(
        email,
        username,
        password,
        riotGameName,
        riotTagLine,
        discord.trim() || undefined
      );
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
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
                <label className="block text-[#F5F5F5]/70 text-sm mb-2">Discord (optional)</label>
                <input
                  type="text"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  className="w-full bg-[#0E0E0E] border border-[#F5F5F5]/20 text-[#F5F5F5] px-4 py-2.5 focus:outline-none focus:border-[#F5F5F5]/40"
                  placeholder="username#1234"
                />
                <p className="text-[#F5F5F5]/40 text-xs mt-2">Your Discord username (visible to team members)</p>
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
          { label: 'About', href: '#' },
          { label: 'Privacy', href: '#' },
          { label: 'Terms', href: '#' },
        ]}
      />
    </div>
  );
}
