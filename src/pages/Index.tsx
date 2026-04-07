import { Link } from "react-router-dom";
import { Shield, Zap, Bell, ArrowRight, Check, Slash } from "lucide-react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/glow-card";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <>
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto border-b border-border/50">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm tracking-widest uppercase text-muted-foreground">XSentinel</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard">
              <Button size="sm" variant="outline" className="border-border bg-secondary/50 text-foreground">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" variant="outline" className="border-border bg-secondary/50 text-foreground">Sign up</Button>
              </Link>
            </>
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
            { icon: <Bell className="h-7 w-7 text-primary" />, title: "Stay protected", desc: "We check your profile every minute. The moment a change is detected — username, display name, bio, profile picture, or banner — you get an alert." },
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
              <div className="text-3xl font-bold text-foreground mb-1">
                $9<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              <p className="text-xs text-muted-foreground">Or $89/yr <span className="text-safe">— save 17%</span></p>
              <p className="text-xs text-muted-foreground mb-5">After 14-day free trial</p>
              <ul className="text-left space-y-2.5 mb-5">
                {[
                  "1 X account protected",
                  "Real-time profile monitoring",
                  "Push + email alerts within minutes",
                  "Full change history",
                  "\"This was me\" quick dismiss",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                    <Check className="h-3.5 w-3.5 text-safe flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/signup">
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
