import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Shield,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  Bell,
  Mail,
  CreditCard,
  Unplug,
  LogOut,
  Slash,
  Loader2,
  Zap,
  Activity,
  Users,
  AtSign,
  User,
  FileText,
  Camera,
  BadgeCheck,
  TrendingDown,
  Clock,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format, subDays, isSameDay } from "date-fns";
import { GlowCard } from "@/components/ui/glow-card";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/custom-toast";

interface ConnectedAccount {
  id: string;
  x_username: string;
  x_display_name: string | null;
  x_avatar_url: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  push_enabled: boolean | null;
  digest_enabled: boolean | null;
  monitoring_error: boolean | null;
  followers_count: number | null;
  last_checked_at: string | null;
  last_snapshot: {
    username?: string;
    display_name?: string;
    bio?: string;
    profile_image?: string;
    banner?: string;
    followers?: number;
    verified?: boolean;
  } | null;
}

interface Alert {
  id: string;
  event_type: string;
  old_data: any;
  new_data: any;
  is_legitimate: boolean | null;
  created_at: string | null;
}

interface SubscriptionInfo {
  subscribed: boolean;
  status: string;
  trial_end: string | null;
  current_period_end: string | null;
  subscription_id: string | null;
}

const pageVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
};

function useCounter(target: number, enabled: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) {
      setVal(target);
      return;
    }
    let frame = 0;
    const frames = 50;
    const timer = setInterval(() => {
      frame++;
      const p = 1 - Math.pow(1 - frame / frames, 3);
      setVal(Math.round(p * target));
      if (frame >= frames) {
        setVal(target);
        clearInterval(timer);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, enabled]);
  return val;
}

const eventConfig: Record<
  string,
  { label: string; Icon: React.ComponentType<any>; accent: string }
> = {
  username: { label: "Username", Icon: AtSign, accent: "#60a5fa" },
  display_name: { label: "Display name", Icon: User, accent: "#a78bfa" },
  bio: { label: "Bio", Icon: FileText, accent: "#fbbf24" },
  profile_image: { label: "Profile picture", Icon: Camera, accent: "#34d399" },
  banner: { label: "Banner", Icon: Camera, accent: "#22d3ee" },
  followers: { label: "Follower count", Icon: TrendingDown, accent: "#f87171" },
  verified: { label: "Verified status", Icon: BadgeCheck, accent: "#facc15" },
};

function StatCard({
  icon: Icon,
  label,
  value,
  accent = "#ffffff",
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <GlowCard>
      <div className="p-4 flex flex-col gap-2.5">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}18` }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
        <p className="text-xl font-bold tracking-tight tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </GlowCard>
  );
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-secondary/90 backdrop-blur border border-border rounded-lg px-3 py-1.5 text-xs shadow-lg">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="text-foreground font-semibold">
        {payload[0].value} alert{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [account, setAccount] = useState<ConnectedAccount | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [connectXLoading, setConnectXLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubInfo(data);
    } catch {
      // No subscription yet
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [accRes, alertRes] = await Promise.all([
        supabase.from("connected_accounts").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      ]);
      if (accRes.data) {
        setAccount(accRes.data);
        setPushEnabled(accRes.data.push_enabled ?? true);
        setDigestEnabled(accRes.data.digest_enabled ?? true);
        // Only check LemonSqueezy if the DB already shows active/paid subscription
        // For trial users, DB value is the truth — LS has no record yet
        if (accRes.data.subscription_status === "active") {
          await checkSubscription();
        }
      }
      if (alertRes.data) setAlerts(alertRes.data);
      setLoading(false);
      setTimeout(() => setDataReady(true), 150);
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success" && !account) {
      const timer = setTimeout(() => {
        handleConnectX();
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [account]);

  useEffect(() => {
    if (!account || !pushEnabled) return;
    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) return;
    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID || "31b40850-42e4-4835-8579-4bfc004ddc04";
    if (!appId) return;
    OneSignal.init({ appId, notifyButton: { enable: false } })
      .then(() => OneSignal.Notifications.requestPermission())
      .then(() => OneSignal.User?.PushSubscription?.id)
      .then((playerId: string | undefined) => {
        if (playerId) {
          supabase.from("connected_accounts").update({ push_token: playerId }).eq("user_id", user!.id);
        }
      })
      .catch((err: any) => console.error("[OneSignal]", err));
  }, [account?.id]);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Subscription activated! Welcome to XSentinel.");
      // Don't call checkSubscription here — LS webhook may not have fired yet
    }
    if (searchParams.get("x_connected") === "1" && user) {
      // Reset subInfo so stale "none" from LemonSqueezy doesn't override
      // the DB trial status we're about to load
      setSubInfo(null);
      supabase.from("connected_accounts").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setAccount(data);
          setPushEnabled(data.push_enabled ?? true);
          setDigestEnabled(data.digest_enabled ?? true);
        }
      });
    }
  }, [searchParams, user]);

  const trialDaysLeft = subInfo?.trial_end
    ? Math.max(0, Math.ceil((new Date(subInfo.trial_end).getTime() - Date.now()) / 86400000))
    : account?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(account.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0;

  const subStatus =
    (subInfo?.status && subInfo.status !== "none" ? subInfo.status : null)
    ?? account?.subscription_status
    ?? "none";

  const isExpired = subStatus === "expired" || subStatus === "canceled" || subStatus === "past_due";
  const isTrial = subStatus === "trialing" || subStatus === "trial";
  const isActive = subStatus === "active";
  const isProtected = isActive || isTrial;

  const handleConnectX = async () => {
    setConnectXLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("x-oauth-start");
      if (error || !data?.url) throw new Error(error?.message || "Failed to start OAuth");
      (window.top || window).location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to connect X account");
      setConnectXLoading(false);
    }
  };

  const handleCheckout = async (plan: "monthly" | "yearly" = "monthly") => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { plan } });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const togglePush = async (val: boolean) => {
    setPushEnabled(val);
    await supabase.from("connected_accounts").update({ push_enabled: val }).eq("user_id", user!.id);
    toast.success(val ? "Push alerts enabled" : "Push alerts disabled — you'll still receive emails");
  };

  const toggleDigest = async (val: boolean) => {
    setDigestEnabled(val);
    await supabase.from("connected_accounts").update({ digest_enabled: val }).eq("user_id", user!.id);
    toast.success(val ? "Weekly digest enabled" : "Weekly digest disabled");
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure? This will stop monitoring your X account.")) return;
    await supabase.from("connected_accounts").delete().eq("user_id", user!.id);
    setAccount(null);
    setAlerts([]);
    toast.success("X account disconnected");
  };

  const handleThisWasMe = async (id: string) => {
    await supabase.from("alerts").update({ is_legitimate: true }).eq("id", id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_legitimate: true } : a)));
  };

  const handleExportCSV = () => {
    if (!alerts.length) return;
    const headers = ["Date", "Type", "Before", "After", "Acknowledged"];
    const rows = alerts.map((a) => {
      const oldVal = a.old_data?.[a.event_type] ?? "";
      const newVal = a.new_data?.[a.event_type] ?? "";
      const date = a.created_at ? new Date(a.created_at).toLocaleString() : "";
      const ack = a.is_legitimate ? "Yes" : "No";
      return [date, a.event_type, String(oldVal), String(newVal), ack]
        .map((v) => `"${v.replace(/"/g, '""')}"`);
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xsentinel-alerts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const activityData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const count = alerts.filter((a) => a.created_at && isSameDay(new Date(a.created_at), date)).length;
    return { day: format(date, "EEE"), count };
  });
  const hasActivity = activityData.some((d) => d.count > 0);
  const maxActivity = Math.max(...activityData.map((d) => d.count), 1);

  const animatedAlerts = useCounter(alerts.length, dataReady);
  const animatedFollowers = useCounter(account?.followers_count ?? 0, dataReady);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <Shield className="h-9 w-9 text-foreground/60" />
          <span className="absolute inset-0 rounded-full bg-foreground/10 animate-ping" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border/60 px-6 py-3.5 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-2.5">
          <img src="/logo-v2.png" alt="XSentinel" className="h-7 w-7" />
          <span className="text-sm font-medium text-foreground/60 tracking-wide">XSentinel</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </nav>

      <motion.div
        className="max-w-2xl mx-auto px-6 py-10 space-y-5"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {isTrial && trialDaysLeft > 5 && (
          <motion.div variants={itemVariants}>
            <div className="rounded-xl border border-[#1D9BF0]/25 bg-[#1D9BF0]/5 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#1D9BF0]/10 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-[#1D9BF0]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Free trial active</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining in your free trial.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => handleCheckout("yearly")} disabled={checkoutLoading} className="text-xs border-border/60">
                  {checkoutLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  $89 / yr
                </Button>
                <Button size="sm" onClick={() => handleCheckout("monthly")} disabled={checkoutLoading} className="text-xs bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white border-0">
                  {checkoutLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  $9 / mo
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {isTrial && trialDaysLeft <= 5 && trialDaysLeft > 0 && (
          <motion.div variants={itemVariants}>
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
              <p className="text-sm text-foreground">
                <span className="font-semibold text-yellow-400">
                  {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}
                </span>{" "}
                left in your free trial — subscribe to keep protection active.
              </p>
            </div>
          </motion.div>
        )}

        {isExpired && (
          <motion.div variants={itemVariants}>
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Subscription ended</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Subscribe to resume monitoring your account.</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => handleCheckout("yearly")} disabled={checkoutLoading} className="text-xs">$89/yr</Button>
                <Button size="sm" onClick={() => handleCheckout("monthly")} disabled={checkoutLoading} className="text-xs">$9/mo</Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Account status card */}
        <motion.div variants={itemVariants}>
          {account ? (
            <GlowCard>
              <div className="p-6 relative overflow-hidden">
                {isProtected && (
                  <div
                    className="absolute left-0 right-0 h-px opacity-15 animate-scan-y pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent 0%, #1D9BF0 50%, transparent 100%)" }}
                  />
                )}
                <div className="flex items-center gap-4">
                  <a
                    href={`https://x.com/${account.x_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative h-16 w-16 rounded-full overflow-hidden bg-muted flex items-center justify-center hover:opacity-85 transition-opacity shrink-0"
                  >
                    {account.x_avatar_url ? (
                      <img src={account.x_avatar_url} alt={account.x_username} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-muted-foreground">
                        {account.x_username.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {isProtected && (
                      <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                    )}
                  </a>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-base truncate">
                      {account.x_display_name || account.x_username}
                    </p>
                    <p className="text-sm text-muted-foreground">@{account.x_username}</p>
                  </div>
                  {isProtected ? (
                    <div className="relative flex items-center shrink-0 p-2 -m-2">
                      <span className="absolute inset-2 rounded-full bg-emerald-500/20 animate-pulse-ring" />
                      <span className="absolute inset-2 rounded-full bg-emerald-500/10 animate-pulse-ring-slow" />
                      <div className="relative flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-400 tracking-wider">PROTECTED</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/25 px-3.5 py-1.5 shrink-0">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-xs font-semibold text-red-400 tracking-wider">INACTIVE</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-5 text-xs text-muted-foreground flex-wrap">
                  {account.followers_count != null && (
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      {account.followers_count.toLocaleString()} followers
                    </span>
                  )}
                  {account.last_checked_at && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Checked {new Date(account.last_checked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  {isProtected && (
                    <span className="ml-auto flex items-center gap-1.5 text-emerald-500/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Monitoring active
                    </span>
                  )}
                </div>
                {account.monitoring_error && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-red-500/8 border border-red-500/20 px-3 py-2.5">
                    <p className="text-xs text-red-400 font-medium">X token expired — reconnect to resume monitoring</p>
                    <Button
                      size="sm" variant="outline" onClick={handleConnectX} disabled={connectXLoading}
                      className="gap-1.5 text-xs h-7 shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      {connectXLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                      Reconnect
                    </Button>
                  </div>
                )}
              </div>
            </GlowCard>
          ) : (
            <GlowCard>
              <div className="p-12 text-center">
                <div className="relative inline-flex mb-6">
                  <Shield className="h-20 w-20 text-muted-foreground/30 animate-float" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">Protect your X account</h2>
                {isTrial || isActive ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
                      Connect via OAuth to start real-time monitoring against hacks
                    </p>
                    <Button size="lg" onClick={handleConnectX} disabled={connectXLoading} className="gap-2 px-10 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white">
                      {connectXLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                      {connectXLoading ? "Redirecting to X..." : "Connect my X Account"}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-2 max-w-xs mx-auto">Start your 30-day free trial</p>
                    <p className="text-xs text-muted-foreground/60 mb-8 max-w-xs mx-auto">Cancel anytime during your trial.</p>
                    <Button size="lg" onClick={() => handleCheckout("monthly")} disabled={checkoutLoading} className="gap-2 px-10 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white">
                      {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                      {checkoutLoading ? "Starting trial..." : "Connect to X"}
                    </Button>
                  </>
                )}
              </div>
            </GlowCard>
          )}
        </motion.div>

        {/* Stats strip */}
        {account && (
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
            <StatCard icon={Activity} label="Total alerts" value={animatedAlerts} accent="#f87171" />
            <StatCard icon={Users} label="Followers" value={animatedFollowers} accent="#60a5fa" />
            <StatCard
              icon={Shield}
              label="Status"
              value={isActive ? "Active" : isTrial ? "Trial" : "Inactive"}
              accent={isProtected ? "#34d399" : "#f87171"}
            />
          </motion.div>
        )}

        {/* Activity chart */}
        {account && hasActivity && (
          <motion.div variants={itemVariants}>
            <GlowCard>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Alert Activity</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Last 7 days</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    {alerts.length} total
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={activityData} margin={{ top: 0, right: 0, left: -32, bottom: 0 }} barCategoryGap="30%">
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(0 0% 42%)", fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)", radius: 4 }} />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {activityData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            entry.count === maxActivity && entry.count > 0
                              ? "#f87171"
                              : entry.count > 0
                              ? "#f8717155"
                              : "hsl(0 0% 11%)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlowCard>
          </motion.div>
        )}

        {/* Snapshot viewer */}
        {account?.last_snapshot && (
          <motion.div variants={itemVariants}>
            <GlowCard>
              <button
                className="w-full p-5 flex items-center justify-between gap-3 text-left"
                onClick={() => setSnapshotOpen((o) => !o)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Eye className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Last known profile snapshot</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {account.last_checked_at
                        ? `Captured ${new Date(account.last_checked_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                        : "Most recent scan"}
                    </p>
                  </div>
                </div>
                {snapshotOpen
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>
              {snapshotOpen && (
                <div className="px-5 pb-5 border-t border-border/40">
                  <div className="pt-4 flex gap-4">
                    {account.last_snapshot.profile_image && (
                      <img
                        src={account.last_snapshot.profile_image}
                        alt="snapshot avatar"
                        className="h-16 w-16 rounded-full object-cover shrink-0 border border-border/40"
                      />
                    )}
                    <div className="flex-1 min-w-0 space-y-2">
                      {account.last_snapshot.display_name && (
                        <div>
                          <p className="text-xs text-muted-foreground">Display name</p>
                          <p className="text-sm text-foreground font-medium truncate">{account.last_snapshot.display_name}</p>
                        </div>
                      )}
                      {account.last_snapshot.username && (
                        <div>
                          <p className="text-xs text-muted-foreground">Username</p>
                          <p className="text-sm text-foreground font-mono">@{account.last_snapshot.username}</p>
                        </div>
                      )}
                      {typeof account.last_snapshot.verified === "boolean" && (
                        <div>
                          <p className="text-xs text-muted-foreground">Verified</p>
                          <p className="text-sm text-foreground">{account.last_snapshot.verified ? "Yes" : "No"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {account.last_snapshot.bio && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Bio</p>
                      <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap border border-border/40 rounded-lg bg-secondary/30 px-3 py-2.5">{account.last_snapshot.bio}</p>
                    </div>
                  )}
                  {account.last_snapshot.banner && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Banner</p>
                      <img
                        src={account.last_snapshot.banner}
                        alt="snapshot banner"
                        className="w-full h-20 rounded-lg object-cover border border-border/40"
                      />
                    </div>
                  )}
                  {account.last_snapshot.followers != null && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {account.last_snapshot.followers.toLocaleString()} followers at last check
                    </div>
                  )}
                </div>
              )}
            </GlowCard>
          </motion.div>
        )}

        {/* Recent alerts */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent Alerts
            </h2>
            {alerts.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {alerts.length} event{alerts.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Export alerts as CSV"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              </div>
            )}
          </div>
          {alerts.length === 0 ? (
            <GlowCard>
              <div className="p-8 text-center">
                <div className="relative inline-flex mb-4">
                  <ShieldCheck className="h-12 w-12 text-emerald-500/50" />
                  <span className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">All clear</p>
                <p className="text-xs text-muted-foreground">No unauthorized changes detected</p>
              </div>
            </GlowCard>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {alerts.map((alert, idx) => {
                const cfg = eventConfig[alert.event_type];
                const Icon = cfg?.Icon ?? Activity;
                const accent = cfg?.accent ?? "#ffffff";
                const oldVal = alert.old_data?.[alert.event_type] ?? null;
                const newVal = alert.new_data?.[alert.event_type] ?? null;
                const isImage = alert.event_type === "profile_image" || alert.event_type === "banner";
                const isFollowers = alert.event_type === "followers";

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    className={`rounded-xl border p-4 ${
                      alert.is_legitimate
                        ? "border-border/50 bg-secondary/30"
                        : "border-red-500/20 bg-red-500/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${accent}18` }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">
                            {cfg?.label ?? alert.event_type} changed
                          </p>
                          {alert.is_legitimate && (
                            <span className="text-xs text-muted-foreground/60 bg-secondary rounded px-1.5 py-0.5">
                              ✓ acknowledged
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {alert.created_at
                            ? new Date(alert.created_at).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </p>
                        {/* What to do — only on unacknowledged, non-follower alerts */}
                        {!alert.is_legitimate && alert.event_type !== "followers" && (
                          <div>
                            <button
                              className="mt-2 flex items-center gap-1 text-xs text-amber-400/80 hover:text-amber-400 transition-colors"
                              onClick={() => setExpandedAlertId(expandedAlertId === alert.id ? null : alert.id)}
                            >
                              <LifeBuoy className="h-3 w-3" />
                              {expandedAlertId === alert.id ? "Hide" : "What should I do?"}
                            </button>
                            {expandedAlertId === alert.id && (
                              <div className="mt-2 rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-3 space-y-1.5 text-xs">
                                <p className="font-semibold text-amber-400">If you didn't make this change:</p>
                                <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                                  <li>Go to <a href="https://x.com/settings/security" target="_blank" rel="noopener noreferrer" className="text-[#1D9BF0] hover:underline">x.com/settings/security</a> immediately</li>
                                  <li>Change your X password right now</li>
                                  <li>Revoke all third-party app access except XSentinel</li>
                                  <li>Enable two-factor authentication if not already on</li>
                                  <li>Check your connected email — it may also be compromised</li>
                                </ol>
                                <p className="text-muted-foreground/60 pt-0.5">If you made this change yourself, click "This was me" to dismiss.</p>
                              </div>
                            )}
                          </div>
                        )}
                        {isFollowers ? (
                          <p className="mt-1.5 text-xs flex items-center gap-1.5">
                            <span className="text-red-400 font-semibold">
                              −{((oldVal ?? 0) - (newVal ?? 0)).toLocaleString()} followers
                            </span>
                            <span className="text-muted-foreground/60">
                              ({(oldVal ?? 0).toLocaleString()} → {(newVal ?? 0).toLocaleString()})
                            </span>
                          </p>
                        ) : isImage ? (
                          <div className="mt-2 flex items-center gap-2">
                            {oldVal ? (
                              <img
                                src={oldVal}
                                alt="before"
                                className={alert.event_type === "banner" ? "h-8 w-14 rounded object-cover" : "h-8 w-8 rounded-full object-cover"}
                              />
                            ) : (
                              <span className="text-xs italic text-muted-foreground">None</span>
                            )}
                            <span className="text-muted-foreground/50 text-xs">→</span>
                            {newVal ? (
                              <img
                                src={newVal}
                                alt="after"
                                className={alert.event_type === "banner" ? "h-8 w-14 rounded object-cover" : "h-8 w-8 rounded-full object-cover"}
                              />
                            ) : (
                              <span className="text-xs italic text-muted-foreground">None</span>
                            )}
                          </div>
                        ) : (
                          <div className="mt-1.5 space-y-0.5">
                            <p className="text-xs flex gap-2 min-w-0">
                              <span className="text-muted-foreground/60 shrink-0 w-10">Before</span>
                              <span className="text-red-400 line-through truncate">{oldVal ?? "—"}</span>
                            </p>
                            <p className="text-xs flex gap-2 min-w-0">
                              <span className="text-muted-foreground/60 shrink-0 w-10">After</span>
                              <span className="text-emerald-400 truncate">{newVal ?? "—"}</span>
                            </p>
                          </div>
                        )}
                      </div>
                      {!alert.is_legitimate && (
                        <Button
                          variant="outline" size="sm"
                          onClick={() => handleThisWasMe(alert.id)}
                          className="text-xs shrink-0 h-7 border-border/60"
                        >
                          This was me
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Settings */}
        <motion.div variants={itemVariants} className="space-y-3 pt-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Settings</h2>

          <GlowCard>
            <div className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Bell className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <Label className="text-foreground font-medium text-sm">Mobile push alerts</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pushEnabled
                        ? "Instant push notifications on profile changes."
                        : "Push disabled — email alerts still active."}
                    </p>
                  </div>
                </div>
                <Switch checked={pushEnabled} onCheckedChange={togglePush} disabled={!account} />
              </div>
              {!account && (
                <p className="text-xs text-muted-foreground/60 italic mt-3 pl-11">
                  Connect your X account to enable push notifications.
                </p>
              )}
            </div>
          </GlowCard>

          <GlowCard>
            <div className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <Label className="text-foreground font-medium text-sm">Weekly digest</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {digestEnabled
                        ? "Weekly summary of monitoring activity."
                        : "Weekly digest emails are paused."}
                    </p>
                  </div>
                </div>
                <Switch checked={digestEnabled} onCheckedChange={toggleDigest} disabled={!account} />
              </div>
            </div>
          </GlowCard>

          <GlowCard>
            <div className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <Label className="text-foreground font-medium text-sm">Subscription</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isExpired
                        ? "Ended — subscribe to continue"
                        : isTrial
                        ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left in trial`
                        : isActive
                        ? "Active — billed via Lemon Squeezy"
                        : "Start with a 30-day free trial"}
                    </p>
                  </div>
                </div>
                {isActive && subInfo?.subscribed ? (
                  <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={portalLoading} className="text-xs">
                    {portalLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                    Manage
                  </Button>
                ) : isTrial ? (
                  <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={portalLoading} className="text-xs text-muted-foreground">
                    {portalLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                    Cancel trial
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleCheckout("yearly")} disabled={checkoutLoading} className="text-xs">$89/yr</Button>
                    <Button size="sm" onClick={() => handleCheckout("monthly")} disabled={checkoutLoading} className="text-xs">$9/mo</Button>
                  </div>
                )}
              </div>
            </div>
          </GlowCard>

          {account && (
            <GlowCard>
              <div className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                      <Unplug className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium text-sm">Disconnect X account</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Stop monitoring and remove connected account</p>
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDisconnect} className="text-xs shrink-0">
                    Disconnect
                  </Button>
                </div>
              </div>
            </GlowCard>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 pt-4 pb-2">
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
              <BreadcrumbSeparator><Slash className="h-3 w-3" /></BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <a href="mailto:support@xsentinel.dev">Support</a>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <p className="text-xs text-muted-foreground/50">
            Report abuse or billing issues:{" "}
            <a href="mailto:support@xsentinel.dev" className="hover:text-muted-foreground transition-colors">
              support@xsentinel.dev
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
