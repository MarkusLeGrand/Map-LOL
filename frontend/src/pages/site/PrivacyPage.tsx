import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header
        brandName="OpenRift"
        tagline="PRO TOOLS FOR EVERYONE"
        showToolsLink={true}
      />

      <div className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-12">
          <h1 className="text-[#F5F5F5] text-5xl font-semibold mb-6 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-[#F5F5F5]/50 text-lg mb-12">
            Last updated: January 8, 2026
          </p>

          <div className="space-y-8 text-[#F5F5F5]/70">
            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Introduction</h2>
              <p className="text-base leading-relaxed">
                OpenRift ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-[#F5F5F5] text-lg font-medium mb-2">Account Information</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Email address</li>
                    <li>Username</li>
                    <li>Riot Games ID (Game Name and Tagline)</li>
                    <li>Profile preferences and settings</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-[#F5F5F5] text-lg font-medium mb-2">Team and Scrim Data</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Team information (name, tag, members)</li>
                    <li>Scrim schedules and availability</li>
                    <li>Match data uploaded for analytics</li>
                    <li>Game statistics and performance metrics</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-[#F5F5F5] text-lg font-medium mb-2">Usage Information</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Browser type and version</li>
                    <li>Pages visited and features used</li>
                    <li>Time and date of visits</li>
                    <li>IP address (for security purposes)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Provide and maintain our services</li>
                <li>Process your team registrations and scrim schedules</li>
                <li>Analyze match data and generate statistics</li>
                <li>Improve our platform and develop new features</li>
                <li>Communicate with you about updates and important information</li>
                <li>Prevent fraud and ensure platform security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Data Sharing and Disclosure</h2>
              <p className="mb-3">We do not sell your personal information. We may share your information in the following cases:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li><strong className="text-[#F5F5F5]">Team Members:</strong> Information you share within teams is visible to other team members</li>
                <li><strong className="text-[#F5F5F5]">Public Analytics:</strong> Team statistics may be visible to other users if you choose to make them public</li>
                <li><strong className="text-[#F5F5F5]">Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong className="text-[#F5F5F5]">Service Providers:</strong> With trusted third parties who help us operate our platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Data Security</h2>
              <p className="text-base leading-relaxed">
                We implement industry-standard security measures to protect your information, including encryption, secure authentication, and regular security audits. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Export your data</li>
                <li>Opt-out of non-essential communications</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, contact us through our Discord community or email support.
              </p>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Riot Games Data</h2>
              <p className="text-base leading-relaxed">
                OpenRift is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.
              </p>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Children's Privacy</h2>
              <p className="text-base leading-relaxed">
                Our service is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Changes to This Policy</h2>
              <p className="text-base leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-base leading-relaxed">
                If you have questions about this Privacy Policy, please join our Discord community at{' '}
                <a href="https://discord.gg/MF3ykPsTD7" target="_blank" rel="noopener noreferrer" className="text-[#3D7A5F] hover:underline">
                  discord.gg/MF3ykPsTD7
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
