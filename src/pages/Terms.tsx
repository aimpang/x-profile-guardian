import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-10">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Effective: April 2026</p>

      <p className="text-muted-foreground mb-8">
        X Sentinel (the "Service") provides real-time alerts when your connected X account's profile changes.
      </p>

      <div className="space-y-8 text-sm text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">1. The Service</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>You must connect an X account you own via OAuth.</li>
            <li>We monitor only that account for public profile changes (handle, bio, avatar, banner, etc.).</li>
            <li>We send alerts via push and email.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">2. Free Trial &amp; Billing</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>14-day free trial.</li>
            <li>Then $9 USD per month (billed monthly via Stripe).</li>
            <li>You can cancel anytime — access continues until the end of the current billing period.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">3. One Account Rule</h2>
          <p>Only one X account per user. You may not monitor accounts you do not own.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">4. Limitations</h2>
          <p>We rely on X's Activity API. We are not responsible if X changes or removes the API.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">5. Limitation of Liability</h2>
          <p>The Service is provided "as is". We are not liable for any damages.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">6. Governing Law</h2>
          <p>Ontario, Canada.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Terms;
