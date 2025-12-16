import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';

export default function AboutPage() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const milestones = [
        {
            year: '2025',
            title: 'Launch',
            description: 'OpenRift platform goes live with Tactical Map as the first tool.',
        },
        {
            year: '2025',
            title: 'Expansion',
            description: 'Adding new tools: Looser Tracker, Drafter, and Data Analytics.',
        },
        {
            year: 'Future',
            title: 'Growth',
            description: 'Building a complete suite of professional tools for competitive teams.',
        },
    ];

    return (
        <div className="w-screen min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
            <Header
                brandName="OpenRift"
                tagline="PRO TOOLS FOR EVERYONE"
                showToolsLink={true}
            />

            {/* Hero Section */}
            <div className="border-b border-[#F5F5F5]/10 py-20">
                <div className={`max-w-[1600px] mx-auto px-12 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="max-w-3xl">
                        <h1 className="text-[#F5F5F5] text-6xl font-semibold mb-6 tracking-tight leading-tight">
                            About OpenRift
                        </h1>
                        <p className="text-[#F5F5F5]/60 text-lg font-normal leading-relaxed mb-8">
                            OpenRift is a platform dedicated to providing professional-grade tools for League of Legends
                            players and teams. Our mission is to make advanced tactical and analytical tools accessible
                            to everyone, from casual players to professional esports organizations.
                        </p>
                        <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#3D7A5F] rounded-full"></div>
                                <span className="text-[#F5F5F5]/50">Open Source Spirit</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#7A5F8E] rounded-full"></div>
                                <span className="text-[#F5F5F5]/50">Community Driven</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#5F7A8E] rounded-full"></div>
                                <span className="text-[#F5F5F5]/50">Professional Quality</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mission Section */}
            <div className="border-b border-[#F5F5F5]/10 py-16">
                <div className="max-w-[1600px] mx-auto px-12">
                    <div className="grid grid-cols-3 gap-8">
                        <div className="p-6 border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02]">
                            <div className="w-3 h-3 rounded-full bg-[#3D7A5F] mb-4"></div>
                            <h3 className="text-[#F5F5F5] text-xl font-semibold mb-3">Our Mission</h3>
                            <p className="text-[#F5F5F5]/60 text-sm leading-relaxed">
                                To democratize access to professional esports tools, empowering players and teams
                                of all levels to improve their gameplay and strategic understanding.
                            </p>
                        </div>
                        <div className="p-6 border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02]">
                            <div className="w-3 h-3 rounded-full bg-[#7A5F8E] mb-4"></div>
                            <h3 className="text-[#F5F5F5] text-xl font-semibold mb-3">Our Vision</h3>
                            <p className="text-[#F5F5F5]/60 text-sm leading-relaxed">
                                A world where every League of Legends player has access to the same quality of tools
                                used by professional teams, fostering growth and competition at all levels.
                            </p>
                        </div>
                        <div className="p-6 border border-[#F5F5F5]/10 bg-[#F5F5F5]/[0.02]">
                            <div className="w-3 h-3 rounded-full bg-[#5F7A8E] mb-4"></div>
                            <h3 className="text-[#F5F5F5] text-xl font-semibold mb-3">Our Values</h3>
                            <p className="text-[#F5F5F5]/60 text-sm leading-relaxed">
                                Quality, accessibility, and community. We believe in creating tools that are
                                powerful yet intuitive, free yet professional, and built with player feedback.
                            </p>
                        </div>
                    </div>
                </div>
            </div>


            {/* Timeline Section */}
            <div className="border-b border-[#F5F5F5]/10 py-16">
                <div className="max-w-[1600px] mx-auto px-12">
                    <div className="mb-12">
                        <h2 className="text-[#F5F5F5] text-4xl font-semibold mb-4 tracking-tight">
                            Our Journey
                        </h2>
                        <p className="text-[#F5F5F5]/50 text-lg">
                            The evolution of OpenRift
                        </p>
                    </div>

                    <div className="space-y-8">
                        {milestones.map((milestone, index) => (
                            <div key={index} className="flex gap-8 items-start">
                                <div className="w-32 flex-shrink-0">
                                    <div className="text-[#3D7A5F] text-2xl font-bold">{milestone.year}</div>
                                </div>
                                <div className="flex-1 pb-8 border-l-2 border-[#F5F5F5]/10 pl-8">
                                    <h3 className="text-[#F5F5F5] text-xl font-semibold mb-2">
                                        {milestone.title}
                                    </h3>
                                    <p className="text-[#F5F5F5]/60 text-sm leading-relaxed">
                                        {milestone.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contact Section */}
            <div className="py-16 bg-[#F5F5F5]/[0.02]">
                <div className="max-w-[1600px] mx-auto px-12">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="text-[#F5F5F5] text-4xl font-semibold mb-4 tracking-tight">
                            Get In Touch
                        </h2>
                        <p className="text-[#F5F5F5]/60 text-lg mb-8">
                            Have questions, suggestions, or want to contribute? We'd love to hear from you.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button className="px-8 py-3 bg-[#3D7A5F] text-[#F5F5F5] text-sm font-medium hover:bg-[#4A9170] transition-colors">
                                Join Community
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Footer
                copyright="© 2025 OpenRift — Professional Tools Platform"
                links={[
                    { label: 'About', href: '/about' },
                    { label: 'Privacy', href: '#' },
                    { label: 'Terms', href: '#' },
                ]}
            />
        </div>
    );
}
