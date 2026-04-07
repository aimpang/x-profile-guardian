import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Zap, Bell, ArrowRight, Check, Slash } from "lucide-react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/glow-card";
import { useAuth } from "@/contexts/AuthContext";
import { useSEO } from "@/hooks/useSEO";

const Index = () => {
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  useSEO({
    title: "XSentinel - Real-time X Account Security Monitoring",
    description: "Monitor your X (Twitter) account for unauthorized changes in real-time. Get instant alerts when your profile, bio, banner, or verified status changes. Protect your X identity with 24/7 monitoring.",
    keywords: "X security, Twitter account monitoring, unauthorized changes alerts, account protection, identity security, real-time monitoring",
    ogTitle: "XSentinel - Real-time X Account Protection",
    ogDescription: "Get instant alerts when your X account is hacked or modified. Monitor all profile changes in real-time.",
    ogImage: "https://xsentinel.dev/og-image.png",
    twitterTitle: "XSentinel - Real-time X Account Protection",
    twitterDescription: "Protect your X account with real-time change monitoring and instant alerts.",
    twitterImage: "https://xsentinel.dev/og-image.png"
  });

  return (
    <>
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto border-b border-border/50">
        <span className="text-sm font-semibold tracking-widest text-foreground">XSENTINEL</span>
        <div className="flex items-center gap-3">
          {user && (
            <Link to="/dashboard">
              <Button size="sm" variant="outline" className="border-border bg-secondary/50 text-foreground">Dashboard</Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-28 pb-24 max-w-3xl mx-auto">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-8">
          Protect your X identity
        </p>
        <h1 className="font-bold text-foreground leading-[1.05] tracking-tight" style={{ fontSize: "clamp(38px, 7vw, 68px)" }}>
          Your X account changes. You find out first.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Set once. Protected forever.
        </p>
        <Link to="/signup" className="mt-12">
          <LiquidButton size="xxl" className="text-lg gap-2">
            Start 14-day free trial <ArrowRight className="h-5 w-5" />
          </LiquidButton>
        </Link>
        <p className="text-xs text-muted-foreground mt-4 tracking-wide">
          14-day free trial · Cancel anytime
        </p>
      </section>

      {/* How it works + Pricing */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground text-center mb-14">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: <Zap className="h-7 w-7 text-primary" />, title: "Sign up", desc: "Sign up instantly, then connect your X account" },
            { icon: <Shield className="h-7 w-7 text-primary" />, title: "Connect X", desc: "Authorize your own X account via OAuth. We only monitor the public profile of the account you own." },
            { icon: <Bell className="h-7 w-7 text-primary" />, title: "Stay protected", desc: "We check every minute. Any change to username, bio, profile picture, banner, or verified badge triggers an instant email alert. Follower drops are monitored too." },
          ].map((step, i) => (
            <GlowCard key={i}>
              <div className="p-6 text-center">
                <div className="flex justify-center mb-4">{step.icon}</div>
                <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </GlowCard>
          ))}

          {/* Pricing card */}
          <GlowCard>
            <div className="p-6 flex flex-col justify-between text-center h-full">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">Simple pricing</h3>

              {/* Billing toggle */}
              <div className="flex gap-2 justify-center mb-4">
                <Button
                  size="sm"
                  variant={billingPeriod === "monthly" ? "default" : "outline"}
                  onClick={() => setBillingPeriod("monthly")}
                  className="text-xs"
                >
                  Monthly
                </Button>
                <Button
                  size="sm"
                  variant={billingPeriod === "yearly" ? "default" : "outline"}
                  onClick={() => setBillingPeriod("yearly")}
                  className="text-xs"
                >
                  Yearly
                </Button>
              </div>

              <div className="text-3xl font-bold text-foreground mb-1">
                {billingPeriod === "monthly" ? "$9" : "$89"}<span className="text-sm font-normal text-muted-foreground">/{billingPeriod === "monthly" ? "mo" : "yr"}</span>
              </div>
              {billingPeriod === "yearly" && (
                <p className="text-xs text-safe mb-3">Save 17% vs monthly</p>
              )}
              <p className="text-xs text-muted-foreground mb-5">After 14-day free trial</p>
              <ul className="text-left space-y-2.5 mb-5">
                {[
                  "1 X account protected",
                  "Monitors bio, avatar, banner, username & verified badge",
                  "Follower drop alerts (≥50 or ≥5% drop)",
                  "Instant email alerts + weekly digest",
                  "Full change history with before & after",
                  "\"This was me\" dismiss",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                    <Check className="h-3.5 w-3.5 text-safe flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link to={`/signup?plan=${billingPeriod}`}>
              <Button className="w-full" size="sm">Start free trial</Button>
            </Link>
            </div>
          </GlowCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} XSentinel. Protect what's yours.</p>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator><Slash className="h-3 w-3" /></BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/terms">Terms</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator><Slash className="h-3 w-3" /></BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/privacy">Privacy</Link></BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </footer>
    </>
  );
};

export default Index;
