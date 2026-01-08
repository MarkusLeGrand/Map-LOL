import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-[#F5F5F5]/50 text-lg mb-12">
            Last updated: January 8, 2026
          </p>

          <div className="space-y-8 text-[#F5F5F5]/70">
            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Acceptance of Terms</h2>
              <p className="text-base leading-relaxed">
                By accessing and using OpenRift, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Description of Service</h2>
              <p className="text-base leading-relaxed mb-3">
                OpenRift is a platform that provides professional tools for League of Legends players and teams, including:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Team management and organization</li>
                <li>Scrim scheduling and coordination</li>
                <li>Match data analytics and statistics</li>
                <li>Player performance tracking</li>
                <li>Tactical planning tools</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">User Accounts</h2>
              <div className="space-y-3">
                <p><strong className="text-[#F5F5F5]">Account Creation:</strong> You must provide accurate and complete information when creating an account.</p>
                <p><strong className="text-[#F5F5F5]">Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
                <p><strong className="text-[#F5F5F5]">Account Termination:</strong> We reserve the right to suspend or terminate accounts that violate these terms or engage in abusive behavior.</p>
              </div>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Acceptable Use</h2>
              <p className="mb-3">You agree NOT to:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Use the platform for any illegal purposes</li>
                <li>Attempt to gain unauthorized access to other users' accounts or data</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Impersonate other users or entities</li>
                <li>Scrape or automatically collect data from the platform</li>
                <li>Interfere with the proper functioning of the platform</li>
                <li>Use the platform to boost, cheat, or gain unfair advantages in League of Legends</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Team Management</h2>
              <p className="text-base leading-relaxed mb-3">
                When using team features:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Team owners have full control over team settings and membership</li>
                <li>Team data may be visible to all team members</li>
                <li>You are responsible for managing team member access appropriately</li>
                <li>Removing a user from a team does not delete their personal data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Data and Analytics</h2>
              <div className="space-y-3">
                <p><strong className="text-[#F5F5F5]">Match Data:</strong> You are responsible for the accuracy of match data you upload. Only upload data from legitimate sources.</p>
                <p><strong className="text-[#F5F5F5]">Data Ownership:</strong> You retain ownership of the data you upload. By uploading data, you grant us a license to process and display it within the platform.</p>
                <p><strong className="text-[#F5F5F5]">Analytics:</strong> Statistics generated from your data may be used to improve our services and may be displayed in aggregate form.</p>
              </div>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Intellectual Property</h2>
              <p className="text-base leading-relaxed mb-3">
                All content, features, and functionality of OpenRift are owned by us and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-base leading-relaxed">
                League of Legends, Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc. OpenRift is not endorsed by Riot Games.
              </p>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Disclaimer of Warranties</h2>
              <p className="text-base leading-relaxed">
                The service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Limitation of Liability</h2>
              <p className="text-base leading-relaxed">
                To the maximum extent permitted by law, OpenRift shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Service Availability</h2>
              <p className="text-base leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any part of the service at any time without notice. We may also impose limits on certain features or restrict access to parts of the service.
              </p>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Third-Party Services</h2>
              <p className="text-base leading-relaxed">
                Our platform may integrate with third-party services (such as Riot Games API). Your use of these services is subject to their respective terms and policies. We are not responsible for third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Changes to Terms</h2>
              <p className="text-base leading-relaxed">
                We may update these Terms of Service at any time. We will notify users of significant changes by posting a notice on the platform or through email. Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Governing Law</h2>
              <p className="text-base leading-relaxed">
                These terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these terms or the use of our service shall be resolved through appropriate legal channels.
              </p>
            </section>

            <section>
              <h2 className="text-[#F5F5F5] text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-base leading-relaxed">
                If you have questions about these Terms of Service, please join our Discord community at{' '}
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
