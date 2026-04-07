import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Zap, Bell, ArrowRight, Check, Slash } from "lucide-react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/glow-card";
import { useAuth } from "@/contexts/AuthContext";
import { useSEO } from "@/hooks/useSEO";
import { Navbar } from "@/components/shared/Navbar";

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
      <Navbar showAuthButtons={true} />

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
            Start 30-day free trial <ArrowRight className="h-5 w-5" />
          </LiquidButton>
        </Link>
        <p className="text-xs text-muted-foreground mt-4 tracking-wide">
          30-day free trial · Cancel anytime
        </p>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 max-w-4xl mx-auto">
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-foreground mb-2">How it works</h2>
          <p className="text-sm text-muted-foreground">Three simple steps to protect your X account</p>
        </div>

        {/* Minimal Timeline */}
        <div className="space-y-16 relative">
          {/* Vertical connector line */}
          <div className="absolute left-[30px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 to-primary/10" />

          {/* Step 1 - Left aligned */}
          <div className="flex gap-8 items-start">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center relative z-10">
              <span className="text-2xl font-light text-primary">01</span>
            </div>
            <div className="pt-2 flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">Sign up</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Create your XSentinel account instantly. Takes less than a minute.</p>
            </div>
          </div>

          {/* Step 2 - Right aligned */}
          <div className="flex gap-8 items-start flex-row-reverse">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center relative z-10">
              <span className="text-2xl font-light text-primary">02</span>
            </div>
            <div className="pt-2 flex-1 text-right">
              <h3 className="text-lg font-semibold text-foreground mb-2">Connect X account</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Authorize via OAuth. We only access your public profile. Never store passwords.</p>
            </div>
          </div>

          {/* Step 3 - Left aligned */}
          <div className="flex gap-8 items-start">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center relative z-10">
              <span className="text-2xl font-light text-primary">03</span>
            </div>
            <div className="pt-2 flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">Get protected</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Real-time monitoring checks every minute. Instant alerts on any changes to your profile.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Refined */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-secondary/40 to-secondary/20 border border-border/50 rounded-lg p-12 flex justify-center">
          <div className="max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Simple pricing</h2>
            <p className="text-sm text-muted-foreground mb-8">Start free. Upgrade anytime. Cancel whenever.</p>

            {/* Billing toggle */}
            <div className="flex gap-2 mb-8 justify-center">
              <Button
                size="sm"
                variant={billingPeriod === "monthly" ? "default" : "ghost"}
                onClick={() => setBillingPeriod("monthly")}
                className="text-sm font-medium"
              >
                Monthly
              </Button>
              <Button
                size="sm"
                variant={billingPeriod === "yearly" ? "default" : "ghost"}
                onClick={() => setBillingPeriod("yearly")}
                className="text-sm font-medium"
              >
                Yearly
              </Button>
            </div>

            {/* Price display */}
            <div className="mb-8">
              <div className="flex items-baseline gap-1 mb-1 justify-center">
                <span className="text-5xl font-light text-foreground">{billingPeriod === "monthly" ? "$9" : "$89"}</span>
                <span className="text-sm text-muted-foreground">/{billingPeriod === "monthly" ? "month" : "year"}</span>
              </div>
              {billingPeriod === "yearly" && (
                <p className="text-xs text-safe font-medium">Save 17% vs monthly</p>
              )}
              <p className="text-xs text-muted-foreground mt-3">After 30-day free trial</p>
            </div>

            {/* Features list - minimal */}
            <ul className="space-y-3 mb-10 inline-block">
              {[
                "Real-time monitoring every minute",
                "Username, bio, avatar, banner, verified badge",
                "Follower drop alerts (≥5% or ≥50 drop)",
                "Instant email alerts + weekly digest",
                "Full change history with before & after",
                "Dismiss false positives with \"This was me\"",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full border border-primary/40 flex items-center justify-center mt-0.5">
                    <Check className="w-2.5 h-2.5 text-primary" />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div>
              <Link to={`/signup?plan=${billingPeriod}`}>
                <Button className="px-8" size="lg">
                  Start 30-day free trial <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
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
