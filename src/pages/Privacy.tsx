import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { Navbar } from "@/components/shared/Navbar";

const Privacy = () => {
  useSEO({
    title: "Privacy Policy - XSentinel",
    description: "Learn how XSentinel protects your data, how we use OAuth credentials, and your privacy rights.",
    keywords: "privacy policy, data protection, privacy, XSentinel, account monitoring",
    ogTitle: "Privacy Policy - XSentinel",
    noindex: false,
    canonical: "https://xsentinel.dev/privacy"
  });

  return (
  <>
    <Navbar />
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-16">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-10">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Effective: April 6, 2026</p>

      <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">1. Who We Are</h2>
          <p>
            XSentinel ("we", "us", "our") operates xsentinel.dev, a service that monitors your X account
            for unauthorized profile changes. We are based in Ontario, Canada.
            Questions: <a href="mailto:privacy@xsentinel.dev" className="text-foreground hover:underline">privacy@xsentinel.dev</a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">2. Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="text-foreground font-medium">Account data:</span> Email address and authentication details when you sign up via email or Google OAuth.</li>
            <li><span className="text-foreground font-medium">X profile data:</span> Username, display name, bio, profile picture URL, and banner URL of the X account you connect. We access this via X's API using tokens you authorize.</li>
            <li><span className="text-foreground font-medium">OAuth tokens:</span> Access and refresh tokens for your connected X account, used solely to poll for profile changes on your behalf.</li>
            <li><span className="text-foreground font-medium">Alert history:</span> Records of detected profile changes, stored in your account.</li>
            <li><span className="text-foreground font-medium">Push notification token:</span> A device token (via OneSignal) if you enable push alerts.</li>
            <li><span className="text-foreground font-medium">Billing data:</span> Subscription status. Payment details are handled exclusively by Lemon Squeezy — we never see or store your card number.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Your Data</h2>
          <p className="mb-2">We use your data only to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Monitor your connected X account for profile changes.</li>
            <li>Send you real-time alert notifications via email and/or push.</li>
            <li>Manage your account, subscription, and trial period.</li>
            <li>Respond to your support requests.</li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p className="mt-2">We do not use your data for advertising, profiling, or any purpose beyond operating the Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Sharing</h2>
          <p className="mb-2">We do not sell your data. We share data only with the following trusted service providers, strictly for operating the Service:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="text-foreground font-medium">Supabase</span> — database and authentication hosting (EU/US data centers).</li>
            <li><span className="text-foreground font-medium">Lemon Squeezy</span> — subscription billing. Subject to Lemon Squeezy's Privacy Policy.</li>
            <li><span className="text-foreground font-medium">Resend</span> — transactional email delivery.</li>
            <li><span className="text-foreground font-medium">OneSignal</span> — push notification delivery. Subject to OneSignal's Privacy Policy.</li>
            <li><span className="text-foreground font-medium">X (Twitter)</span> — we access X's API on your behalf using your authorized tokens.</li>
          </ul>
          <p className="mt-2">We may disclose data if required by law, court order, or to protect the rights and safety of our users.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Your data is retained for as long as your account is active.</li>
            <li>Alert history is retained for 90 days, then automatically deleted.</li>
            <li>Upon account deletion, all personal data is permanently deleted within 30 days.</li>
            <li>Lemon Squeezy may retain billing records for legal compliance purposes beyond account deletion.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">6. Your Rights</h2>
          <p className="mb-2">Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="text-foreground font-medium">Access</span> — request a copy of the personal data we hold about you.</li>
            <li><span className="text-foreground font-medium">Correction</span> — request correction of inaccurate data.</li>
            <li><span className="text-foreground font-medium">Deletion</span> — request deletion of your account and associated data.</li>
            <li><span className="text-foreground font-medium">Portability</span> — request your data in a machine-readable format.</li>
            <li><span className="text-foreground font-medium">Withdrawal of consent</span> — disconnect your X account or delete your account at any time from the dashboard.</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, email{" "}
            <a href="mailto:privacy@xsentinel.dev" className="text-foreground hover:underline">privacy@xsentinel.dev</a>.
            We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">7. Security</h2>
          <p>
            We implement industry-standard security measures including encrypted data transmission (HTTPS/TLS),
            encrypted storage of sensitive tokens, and row-level security on our database. No system is
            completely secure; we cannot guarantee absolute security of your data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">8. Cookies</h2>
          <p>
            We use only essential cookies required for authentication (session management via Supabase Auth).
            We do not use tracking, advertising, or analytics cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">9. Children's Privacy</h2>
          <p>
            The Service is not directed at children under 18. We do not knowingly collect data from minors.
            If you believe a minor has created an account, contact us and we will delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be communicated
            by email at least 14 days before taking effect. Continued use of the Service after changes
            take effect constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">11. Contact</h2>
          <p>
            Privacy inquiries:{" "}
            <a href="mailto:privacy@xsentinel.dev" className="text-foreground hover:underline">
              privacy@xsentinel.dev
            </a>
            <br />
            General support:{" "}
            <a href="mailto:support@xsentinel.dev" className="text-foreground hover:underline">
              support@xsentinel.dev
            </a>
          </p>
        </section>

      </div>
      </div>
    </div>
  </>
  );
};

export default Privacy;
