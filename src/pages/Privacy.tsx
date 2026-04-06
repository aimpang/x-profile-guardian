import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-10">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="space-y-8 text-sm text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">What we collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Email and account info from your login (Google, Apple, or email)</li>
            <li>X profile data (username, display name, bio, avatar, banner) only for the account you explicitly connect via OAuth</li>
            <li>Alert history</li>
            <li>Push notification token (if you enable mobile alerts)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">How we use it</h2>
          <p className="mb-2">We use this data only to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Send you real-time profile change alerts</li>
            <li>Manage your subscription and trial</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Data sharing</h2>
          <p className="mb-2">We do not sell your data.</p>
          <p>We share data only with: Supabase (hosting), Stripe (billing), X (OAuth + webhooks), and your chosen push notification service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Deletion</h2>
          <p>You can request deletion of your data at any time by emailing us.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Privacy;
