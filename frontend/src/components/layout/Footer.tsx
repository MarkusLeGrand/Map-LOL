import { SPACING } from '../../constants/theme';

interface FooterLink {
    label: string;
    href: string;
}

interface FooterProps {
    copyright?: string;
    links?: FooterLink[];
}

export function Footer({
    copyright = '© 2025 LeagueHub — Professional Tools Platform',
    links = [
        { label: 'About', href: '/about' },
        { label: 'Privacy', href: '#' },
        { label: 'Terms', href: '#' },
    ],
}: FooterProps) {
    return (
        <footer className="border-t border-[#F5F5F5]/10 py-8">
            <div className={`max-w-[${SPACING.containerMaxWidth}] mx-auto ${SPACING.containerPadding} flex items-center justify-between`}>
                <p className="text-[#F5F5F5]/30 text-xs tracking-wide">
                    {copyright}
                </p>
                <div className="flex gap-6 text-xs text-[#F5F5F5]/40">
                    {links.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="hover:text-[#F5F5F5]/60 transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}
