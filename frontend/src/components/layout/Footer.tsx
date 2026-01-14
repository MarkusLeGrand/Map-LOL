import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface FooterLink {
    label: string;
    href: string;
}

interface FooterProps {
    copyright?: string;
    links?: FooterLink[];
}

const DEFAULT_LINKS: FooterLink[] = [
    { label: 'About', href: '/about' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
];

export function Footer({
    copyright = '© 2025 OpenRift — Professional Tools Platform',
    links,
}: FooterProps) {
    const { token } = useAuth();
    const toast = useToast();
    const [showBugModal, setShowBugModal] = useState(false);
    const [bugTitle, setBugTitle] = useState('');
    const [bugDescription, setBugDescription] = useState('');
    const [bugCategory, setBugCategory] = useState('bug');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Always include Discord as first link, then custom or default links
    const discordLink = { label: 'Discord', href: 'https://discord.gg/MF3ykPsTD7' };
    const footerLinks = [discordLink, ...(links || DEFAULT_LINKS)];

    const handleSubmitBug = async () => {
        if (!token) {
            toast?.error('Please log in to submit a bug report');
            setShowBugModal(false);
            return;
        }

        if (!bugTitle.trim() || !bugDescription.trim()) {
            toast?.error('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/tickets/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: bugTitle,
                    description: bugDescription,
                    category: bugCategory,
                    page_url: window.location.href,
                    user_agent: navigator.userAgent
                })
            });

            if (response.ok) {
                toast?.success('Bug report submitted successfully!');
                setShowBugModal(false);
                setBugTitle('');
                setBugDescription('');
                setBugCategory('bug');
            } else {
                throw new Error('Failed to submit');
            }
        } catch (error) {
            toast?.error('Failed to submit bug report');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <footer className="border-t border-[#F5F5F5]/10 py-8">
                <div className="w-full px-12 flex items-center justify-between">
                    <p className="text-[#F5F5F5]/30 text-xs tracking-wide">
                        {copyright}
                    </p>
                    <div className="flex gap-6 text-xs text-[#F5F5F5]/40">
                        {/* Bug Report Button */}
                        <button
                            onClick={() => setShowBugModal(true)}
                            className="hover:text-[#F5F5F5]/60 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Report Bug
                        </button>

                        {footerLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="hover:text-[#F5F5F5]/60 transition-colors flex items-center gap-1"
                                target={link.href.startsWith('http') ? '_blank' : undefined}
                                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                            >
                                {link.label === 'Discord' && (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                                    </svg>
                                )}
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            </footer>

            {/* Bug Report Modal */}
            {showBugModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 rounded-lg max-w-lg w-full">
                        <div className="p-6 border-b border-[#F5F5F5]/10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-[#F5F5F5] flex items-center gap-2">
                                    <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Report a Bug
                                </h2>
                                <button
                                    onClick={() => setShowBugModal(false)}
                                    className="text-[#F5F5F5]/60 hover:text-[#F5F5F5]"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Category */}
                            <div>
                                <label className="block text-[#F5F5F5]/60 text-xs mb-2">Category</label>
                                <select
                                    value={bugCategory}
                                    onChange={(e) => setBugCategory(e.target.value)}
                                    className="w-full bg-[#0E0E0E] border border-[#F5F5F5]/20 text-[#F5F5F5] px-4 py-3 rounded focus:outline-none focus:border-[#F5F5F5]/40"
                                >
                                    <option value="bug">Bug Report</option>
                                    <option value="feature">Feature Request</option>
                                    <option value="feedback">Feedback</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-[#F5F5F5]/60 text-xs mb-2">Title</label>
                                <input
                                    type="text"
                                    value={bugTitle}
                                    onChange={(e) => setBugTitle(e.target.value)}
                                    placeholder="Brief description of the issue"
                                    className="w-full bg-[#0E0E0E] border border-[#F5F5F5]/20 text-[#F5F5F5] px-4 py-3 rounded focus:outline-none focus:border-[#F5F5F5]/40"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[#F5F5F5]/60 text-xs mb-2">Description</label>
                                <textarea
                                    value={bugDescription}
                                    onChange={(e) => setBugDescription(e.target.value)}
                                    placeholder="Describe the issue in detail. What happened? What did you expect to happen?"
                                    rows={4}
                                    className="w-full bg-[#0E0E0E] border border-[#F5F5F5]/20 text-[#F5F5F5] px-4 py-3 rounded focus:outline-none focus:border-[#F5F5F5]/40 resize-none"
                                />
                            </div>

                            {/* Info */}
                            <div className="bg-[#F5F5F5]/5 border border-[#F5F5F5]/10 rounded p-3">
                                <p className="text-[#F5F5F5]/50 text-xs">
                                    Your current page URL and browser info will be included to help us debug the issue.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowBugModal(false)}
                                    className="flex-1 px-4 py-3 border border-[#F5F5F5]/20 text-[#F5F5F5] rounded hover:bg-[#F5F5F5]/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitBug}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 bg-[#3D7A5F] text-[#F5F5F5] rounded hover:bg-[#3D7A5F]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
