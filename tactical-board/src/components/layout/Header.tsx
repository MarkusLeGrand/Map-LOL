import { useNavigate } from 'react-router-dom';
import { COLORS, SPACING } from '../../constants/theme';

interface HeaderProps {
    brandName?: string;
    tagline?: string;
    showToolsLink?: boolean;
    showAboutLink?: boolean;
    onLoginClick?: () => void;
    onSignUpClick?: () => void;
}

export function Header({
    brandName = 'OpenRift',
    tagline = 'PRO TOOLS FOR EVERYONE',
    showToolsLink = true,
    showAboutLink = true,
    onLoginClick,
    onSignUpClick,
}: HeaderProps) {
    const navigate = useNavigate();

    return (
        <header className="border-b border-[#F5F5F5]/10 sticky top-0 bg-[#0E0E0E] z-50">
            <div className={`max-w-[${SPACING.containerMaxWidth}] mx-auto ${SPACING.containerPadding} py-6 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="text-[#F5F5F5] text-xl font-semibold tracking-wide hover:text-[#F5F5F5]/80 transition-colors"
                        style={{ letterSpacing: '0.02em' }}
                    >
                        {brandName}
                    </button>
                    <span className="text-[#F5F5F5]/40 text-xs font-medium tracking-wider">
                        {tagline}
                    </span>
                    {showAboutLink && (
                        <button
                            onClick={() => navigate('/about')}
                            className="ml-6 text-sm font-medium text-[#F5F5F5]/50 hover:text-[#F5F5F5] transition-colors"
                        >
                            About
                        </button>
                    )}
                    {showToolsLink && (
                        <button
                            onClick={() => navigate('/tools')}
                            className="ml-6 text-sm font-medium text-[#F5F5F5]/50 hover:text-[#F5F5F5] transition-colors"
                        >
                            Tools
                        </button>
                    )}
                </div>
                <nav className="flex gap-4">
                    <button
                        onClick={onLoginClick}
                        className="px-5 py-2 text-[#F5F5F5]/60 text-sm font-medium hover:text-[#F5F5F5] transition-colors"
                    >
                        Login
                    </button>
                    <button
                        onClick={onSignUpClick}
                        className={`px-5 py-2 bg-[${COLORS.primary}] text-[#F5F5F5] text-sm font-medium hover:bg-[#4A9170] transition-colors`}
                    >
                        Sign Up
                    </button>
                </nav>
            </div>
        </header>
    );
}
