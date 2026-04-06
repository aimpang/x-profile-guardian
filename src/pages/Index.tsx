import { Link } from "react-router-dom";
import { Shield, Zap, Bell, ArrowRight, Check, Slash } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <>
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto border-b border-border/50">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm tracking-widest uppercase text-muted-foreground">XGuard</span>
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

      {/* Hero — full viewport */}
      <section className="flex flex-col items-center justify-center text-center px-6" style={{ minHeight: "calc(100vh - 65px)" }}>
        <p className="text-xs tracking-[0.14em] uppercase text-muted-foreground mb-4 mx-[150px]">Defend your X account</p>
        <h1 className="font-semibold text-foreground leading-[0.95]" style={{ fontSize: "clamp(48px, 10vw, 96px)" }}>
          XGuard
        </h1>
        <p className="mt-5 text-muted-foreground text-base sm:text-lg max-w-md">
          Instant alerts the moment your X profile changes. Set once. Forget forever.
        </p>
        <Link to="/signup" className="mt-8">
          <Button size="lg" className="text-base px-8 gap-2">
            Start free trial <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground mt-3">14-day free trial · No credit card required</p>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: <Zap className="h-8 w-8 text-primary" />, title: "Sign up", desc: "Create your account in seconds with just an email." },
            { icon: <Shield className="h-8 w-8 text-primary" />, title: "Connect X", desc: "Authorize your X account via OAuth. We only monitor your own profile." },
            { icon: <Bell className="h-8 w-8 text-primary" />, title: "Stay protected", desc: "Get instant push & email alerts if anything changes." },
          ].map((step, i) => (
            <div key={i} className="text-center p-6 rounded-xl border border-border bg-secondary/50 backdrop-blur-sm">
              <div className="flex justify-center mb-4">{step.icon}</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-24 max-w-lg mx-auto text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Simple pricing</h2>
        <p className="text-muted-foreground mb-10">One plan. Full protection.</p>
        <div className="rounded-2xl border border-border bg-secondary/50 backdrop-blur-sm p-8">
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
      <footer className="border-t border-border px-6 py-8 flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} XGuard. Protect what's yours.</p>
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
