import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Shield, ArrowRight, Check, Users, BadgeCheck,
  FileText, Image, User, Bell, Mail, Clock, ChevronRight,
  ExternalLink, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const ONBOARDING_KEY = "xsentinel_onboarding_v1";

// ─── slide transition variants ────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "60%" : "-60%", opacity: 0, filter: "blur(8px)" }),
  center: { x: 0, opacity: 1, filter: "blur(0px)" },
  exit: (dir: number) => ({ x: dir < 0 ? "60%" : "-60%", opacity: 0, filter: "blur(8px)" }),
};

const slideTransition = { type: "spring", bounce: 0.18, duration: 0.55 };

// ─── stagger container ────────────────────────────────────────────────────────
const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
  hidden: {},
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.3, duration: 0.5 } },
};

// ─── Onboarding shell ─────────────────────────────────────────────────────────
const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [connectLoading, setConnectLoading] = useState(false);

  const done = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  const next = useCallback(() => {
    if (step < 2) { setDirection(1); setStep(s => s + 1); }
    else done();
  }, [step, done]);

  const back = useCallback(() => {
    setDirection(-1);
    setStep(s => s - 1);
  }, []);

  const handleConnectX = async () => {
    setConnectLoading(true);
    localStorage.setItem(ONBOARDING_KEY, "1");
    try {
      const { data, error } = await supabase.functions.invoke("x-oauth-start");
      if (error || !data?.url) throw new Error("Failed to start OAuth");
      window.location.href = data.url;
    } catch {
      setConnectLoading(false);
    }
  };

  const slides = [
    <Slide1 key="s1" />,
    <Slide2 key="s2" />,
    <Slide3 key="s3" onConnect={handleConnectX} onSkip={done} connectLoading={connectLoading} />,
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 max-w-2xl mx-auto w-full shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm tracking-widest uppercase text-muted-foreground">XSentinel</span>
        </div>
        <button
          onClick={done}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slide area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 py-4"
          >
            <div className="w-full max-w-lg">
              {slides[step]}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer: dots + nav */}
      <div className="px-6 py-8 max-w-2xl mx-auto w-full flex items-center justify-between shrink-0">
        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ width: i === step ? 20 : 6, opacity: i === step ? 1 : 0.25 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
              className="h-1.5 rounded-full bg-primary cursor-pointer"
              onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
            />
          ))}
        </div>

        {/* Nav buttons */}
        <div className="flex gap-3 items-center">
          {step > 0 && (
            <Button variant="ghost" size="sm" onClick={back} className="text-muted-foreground">
              Back
            </Button>
          )}
          {step < 2 && (
            <Button size="sm" onClick={next} className="gap-1.5">
              Next <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {step === 2 && (
            <Button size="sm" onClick={done} variant="outline" className="text-muted-foreground">
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

// ─── Slide 1: Welcome ─────────────────────────────────────────────────────────
const FEATURES = [
  { icon: User, label: "Username" },
  { icon: FileText, label: "Bio" },
  { icon: Image, label: "Profile picture" },
  { icon: Image, label: "Banner" },
  { icon: BadgeCheck, label: "Verified badge" },
  { icon: Users, label: "Follower drops" },
];

const Slide1 = () => (
  <div className="flex flex-col gap-8">
    {/* Headline */}
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
    >
      <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground">Welcome to XSentinel</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-[1.08] tracking-tight">
        Your X account,<br />protected 24/7.
      </h1>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
        We check your profile every minute and alert you the moment anything changes — even if you're asleep.
      </p>
    </motion.div>

    {/* Feature grid */}
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-2"
    >
      {FEATURES.map(({ icon: Icon, label }) => (
        <motion.div
          key={label}
          variants={fadeUp}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-3 flex flex-col gap-2 hover:border-border transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
          {/* Subtle glow on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/5 to-transparent pointer-events-none rounded-xl" />
        </motion.div>
      ))}
    </motion.div>

    {/* Pulse indicator */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="flex items-center gap-2.5 text-xs text-muted-foreground"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--safe))] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--safe))]" />
      </span>
      Monitoring every 60 seconds, automatically
    </motion.div>
  </div>
);

// ─── Slide 2: How it works — interactive mini dashboard ───────────────────────
const DEMO_TABS = [
  {
    id: "monitoring",
    label: "Monitoring",
    header: "Always watching",
    description: "Polling X API every 60 seconds.",
  },
  {
    id: "alert",
    label: "Alert email",
    header: "Instant notification",
    description: "Email with before & after proof.",
    badge: "1",
  },
  {
    id: "history",
    label: "History",
    header: "Full audit trail",
    description: "Every change, timestamped.",
  },
];

const DemoMonitoring = () => (
  <div className="flex flex-col gap-3">
    <div className="p-3.5 rounded-xl border border-border/40 bg-gradient-to-br from-background to-muted/20">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Status</span>
        <span className="flex items-center gap-1.5 text-[9px] text-[hsl(var(--safe))] font-medium">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--safe))] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[hsl(var(--safe))]" />
          </span>
          Protected
        </span>
      </div>
      <div className="flex items-end gap-1 mb-1">
        {[40, 55, 35, 65, 50, 70, 45, 60, 55, 75, 50, 65].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: h * 0.6 }}
            transition={{ delay: i * 0.04, type: "spring", bounce: 0.3 }}
            className="flex-1 rounded-sm bg-primary/20"
            style={{ minHeight: 4 }}
          />
        ))}
      </div>
      <span className="text-[8px] text-muted-foreground">Polling activity — last 12 cycles</span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="p-3 rounded-xl border border-border/40 bg-background/50">
        <div className="text-[10px] font-semibold text-foreground">60 sec</div>
        <div className="text-[8px] text-muted-foreground uppercase mt-0.5">Poll interval</div>
      </div>
      <div className="p-3 rounded-xl border border-border/40 bg-background/50">
        <div className="text-[10px] font-semibold text-foreground">6 signals</div>
        <div className="text-[8px] text-muted-foreground uppercase mt-0.5">Monitored</div>
      </div>
    </div>
  </div>
);

const DemoAlert = () => (
  <div className="flex flex-col gap-2">
    <div className="rounded-xl border border-border/40 overflow-hidden bg-background/50">
      <div className="bg-muted/30 px-3 py-2 border-b border-border/40">
        <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">
          Security Alert: Bio Changed
        </span>
      </div>
      <div className="p-3 space-y-2">
        {[
          { label: "Field", value: "Bio", muted: false },
          { label: "Before", value: "The original bio text...", muted: true, strike: true },
          { label: "After", value: "Updated bio content", muted: false, green: true },
        ].map((row) => (
          <div key={row.label} className="flex gap-3 text-[9px]">
            <span className="text-muted-foreground w-10 shrink-0">{row.label}</span>
            <span className={cn(
              "truncate",
              row.strike && "line-through text-muted-foreground",
              row.green && "text-[hsl(var(--safe))]",
              !row.muted && !row.strike && !row.green && "text-foreground font-medium",
            )}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
    <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center gap-2">
      <span className="text-sm">⚠️</span>
      <span className="text-[8px] text-amber-700 dark:text-amber-400 font-medium">Was this you? Secure your account →</span>
    </div>
  </div>
);

const DemoHistory = () => (
  <div className="flex flex-col gap-1.5">
    {[
      { event: "Bio changed", time: "2 min ago", acknowledged: false },
      { event: "Banner changed", time: "1h ago", acknowledged: true },
      { event: "Profile picture changed", time: "3h ago", acknowledged: true },
      { event: "Username changed", time: "2d ago", acknowledged: true },
    ].map((item, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.06, type: "spring", bounce: 0.2 }}
        className={cn(
          "flex items-center justify-between p-2 rounded-lg border text-[9px]",
          item.acknowledged ? "border-border/40 bg-muted/20" : "border-destructive/30 bg-destructive/5"
        )}
      >
        <span className={cn("font-medium", item.acknowledged ? "text-muted-foreground" : "text-foreground")}>
          {item.event}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{item.time}</span>
          {item.acknowledged && <Check className="h-2.5 w-2.5 text-muted-foreground" />}
        </div>
      </motion.div>
    ))}
  </div>
);

const Slide2 = () => {
  const [activeTab, setActiveTab] = useState(DEMO_TABS[0]);

  const content = {
    monitoring: <DemoMonitoring />,
    alert: <DemoAlert />,
    history: <DemoHistory />,
  }[activeTab.id];

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
      >
        <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground">How it works</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-[1.08] tracking-tight">
          Instant alerts.<br />Zero effort.
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
          Connect once. We handle the monitoring, diff detection, and alerts — you just review the changes.
        </p>
      </motion.div>

      {/* Interactive mini dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.7, delay: 0.15 }}
        className="group relative w-full overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-primary/5 hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-0.5"
      >
        <div className="relative w-full h-[240px] overflow-hidden rounded-2xl">
          <div className="absolute top-8 left-0 right-0 bottom-0 bg-background flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-border/70 flex items-center relative">
              <div className="flex gap-1.5">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground/20" />)}
              </div>
              <div className="absolute left-1/2 -translate-x-1/2">
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">XSentinel Dashboard</span>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className="w-28 border-r border-border/30 p-2 flex flex-col gap-0.5 pt-4 bg-muted/5">
                <LayoutGroup id="onboarding-tabs">
                  {DEMO_TABS.map((tab) => {
                    const isActive = activeTab.id === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer",
                          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="z-20 relative font-medium truncate">{tab.label}</span>
                        {tab.badge && (
                          <span className={cn(
                            "ml-auto text-[7px] leading-none py-0.5 px-1 rounded-md tabular-nums z-20 relative",
                            isActive
                              ? "bg-destructive/20 text-destructive border border-destructive/20"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {tab.badge}
                          </span>
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="onboarding-pill"
                            className="absolute left-0 w-[2px] h-3.5 rounded-full bg-primary z-30"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                          />
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="onboarding-bg"
                            className="absolute inset-0 rounded-lg bg-muted border border-border/40"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </LayoutGroup>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 pt-4 overflow-hidden relative">
                <div className="mb-2">
                  <h3 className="text-[9px] font-semibold text-foreground uppercase opacity-60 tracking-wider">{activeTab.header}</h3>
                  <p className="text-[8px] text-muted-foreground">{activeTab.description}</p>
                </div>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={activeTab.id}
                    initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {content}
                  </motion.div>
                </AnimatePresence>
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Slide 3: Get started ─────────────────────────────────────────────────────
const STEPS = [
  { label: "Connect your X account via OAuth", sub: "We never see your password" },
  { label: "Monitoring starts immediately", sub: "First scan runs within 60 seconds" },
  { label: "Get alerted when anything changes", sub: "Email with before & after proof" },
];

const Slide3 = ({
  onConnect,
  onSkip,
  connectLoading,
}: {
  onConnect: () => void;
  onSkip: () => void;
  connectLoading: boolean;
}) => (
  <div className="flex flex-col gap-8">
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
    >
      <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground">You're almost there</p>
      <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-[1.08] tracking-tight">
        Set up takes<br />30 seconds.
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
        Authorize your X account via OAuth. We only read your public profile — never your DMs or feed.
      </p>
    </motion.div>

    {/* Step checklist */}
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      {STEPS.map((step, i) => (
        <motion.div
          key={i}
          variants={fadeUp}
          className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card"
        >
          <div className="w-5 h-5 rounded-full bg-[hsl(var(--safe))]/15 flex items-center justify-center shrink-0 mt-0.5">
            <Check className="h-3 w-3 text-[hsl(var(--safe))]" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{step.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{step.sub}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>

    {/* CTA */}
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, type: "spring", bounce: 0.2 }}
      className="flex flex-col gap-3"
    >
      <Button
        size="lg"
        onClick={onConnect}
        disabled={connectLoading}
        className="gap-2 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white w-full"
      >
        {connectLoading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <ExternalLink className="h-4 w-4" />}
        {connectLoading ? "Redirecting to X..." : "Connect my X Account"}
      </Button>
      <button
        onClick={onSkip}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
      >
        Skip for now — I'll connect later
      </button>
    </motion.div>
  </div>
);
