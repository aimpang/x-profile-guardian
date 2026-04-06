import { Link } from "react-router-dom";
import { Shield, Zap, Bell, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DottedSurface } from "@/components/ui/dotted-surface";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">XGuard</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-24 pb-20 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground mb-8">
          <Shield className="h-4 w-4 text-primary" />
          Defend your X account
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-6">
          Protect your X account<br />from hacks
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Get instant alerts when your profile is changed — username, bio, avatar, or banner. Set it once, forget it forever.
        </p>
        <Link to="/signup">
          <Button size="lg" className="text-base px-8 gap-2">
            Start free trial <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground mt-4">14-day free trial · No credit card required</p>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: <Zap className="h-8 w-8 text-primary" />, title: "Sign up", desc: "Create your account in seconds with just an email." },
            { icon: <Shield className="h-8 w-8 text-primary" />, title: "Connect X", desc: "Authorize your X account via OAuth. We only monitor your own profile." },
            { icon: <Bell className="h-8 w-8 text-primary" />, title: "Stay protected", desc: "Get instant push & email alerts if anything changes." },
          ].map((step, i) => (
            <div key={i} className="text-center p-6 rounded-xl border border-border bg-secondary">
              <div className="flex justify-center mb-4">{step.icon}</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 max-w-lg mx-auto text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Simple pricing</h2>
        <p className="text-muted-foreground mb-10">One plan. Full protection.</p>
        <div className="rounded-2xl border border-border bg-secondary p-8">
          <div className="text-4xl font-bold text-foreground mb-1">$9<span className="text-lg font-normal text-muted-foreground">/month</span></div>
          <p className="text-sm text-muted-foreground mb-6">After 14-day free trial</p>
          <ul className="text-left space-y-3 mb-8">
            {["1 X account protected", "Real-time profile monitoring", "Push & email alerts", "Alert history with before/after", "\"This was me\" quick dismiss"].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                <Check className="h-4 w-4 text-safe flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Link to="/signup">
            <Button className="w-full" size="lg">Start free trial</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} XGuard. Protect what's yours.
      </footer>
    </div>
  );
};

export default Index;
