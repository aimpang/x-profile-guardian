import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { Navbar } from "@/components/shared/Navbar";

const Terms = () => {
  useSEO({
    title: "Terms of Service - XSentinel",
    description: "Read XSentinel's terms of service, including eligibility, billing, and usage policies for X account monitoring.",
    keywords: "terms of service, terms, legal, XSentinel, account monitoring",
    ogTitle: "Terms of Service - XSentinel",
    noindex: false,
    canonical: "https://xsentinel.dev/terms"
  });

  return (
  <>
    <Navbar />
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-16">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-10">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Effective: April 6, 2026</p>

      <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">1. Agreement</h2>
          <p>
            By creating an account or using XSentinel ("Service", "we", "us"), you agree to these Terms.
            If you do not agree, do not use the Service. These Terms constitute a binding legal agreement
            between you and XSentinel.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">2. Eligibility</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>You must be at least 18 years old to use the Service.</li>
            <li>You must have the legal authority to enter into this agreement.</li>
            <li>You may only connect X accounts that you personally own and control.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">3. What We Do</h2>
          <p className="mb-2">
            XSentinel monitors your connected X account for profile changes — including username, display name,
            bio, profile picture, and banner — and sends you alerts via email and push notification when
            changes are detected. Monitoring occurs by periodically polling X's public API on your behalf
            using the OAuth credentials you provide.
          </p>
          <p>
            Detection is not instantaneous. Alerts are typically delivered within minutes of a change occurring,
            but we make no guarantee of real-time delivery.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">4. Free Trial &amp; Billing</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>New accounts receive a 14-day free trial with full access to all features.</li>
            <li>After the trial, continued access requires a paid subscription: $9 USD/month or $89 USD/year.</li>
            <li>Billing is handled by Lemon Squeezy. Your payment method is charged at the start of each billing period.</li>
            <li>You may cancel at any time. Access continues until the end of the current paid period. No refunds are issued for partial periods.</li>
            <li>We reserve the right to change pricing with 30 days notice to existing subscribers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">5. Acceptable Use</h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Monitor X accounts you do not own or have explicit written permission to monitor.</li>
            <li>Use the Service for any illegal purpose or in violation of X's Terms of Service.</li>
            <li>Attempt to reverse-engineer, scrape, or interfere with the Service or its infrastructure.</li>
            <li>Share your account credentials with third parties.</li>
            <li>Use the Service to harass, stalk, or harm any individual.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">6. One Account Per User</h2>
          <p>
            Each XSentinel account may monitor one connected X account. Creating multiple accounts to
            circumvent this limit is prohibited and may result in termination of all associated accounts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">7. Service Availability</h2>
          <p>
            We strive for high availability but do not guarantee uninterrupted service. Monitoring may
            be affected by X API downtime, rate limiting, changes to X's platform, or scheduled maintenance.
            We are not liable for missed alerts caused by circumstances outside our reasonable control.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">8. Termination</h2>
          <p>
            We may suspend or terminate your account at our discretion if you violate these Terms, engage
            in fraudulent activity, or if required by law. You may delete your account at any time from
            the dashboard. Upon termination, your data will be deleted in accordance with our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">9. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" and "as available" without warranties of any kind, express or
            implied. We do not warrant that the Service will be error-free, secure, or that alerts will
            always be delivered. Use of the Service is at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, XSentinel shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, including loss of data, loss of
            revenue, or failure to detect unauthorized account changes. Our total liability to you for
            any claim shall not exceed the amount you paid us in the 30 days preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">11. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Material changes will be communicated by email
            at least 14 days in advance. Continued use of the Service after changes take effect constitutes
            acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">12. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the Province of Ontario, Canada, without regard to
            conflict of law principles. Any disputes shall be resolved in the courts of Ontario.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">13. Contact</h2>
          <p>
            Questions? Email us at{" "}
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

export default Terms;
