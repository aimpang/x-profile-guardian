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
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
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

const eventLabels: Record<string, string> = {
  username: "Username",
  display_name: "Display name",
  bio: "Bio",
  profile_image: "Profile picture",
  banner: "Banner",
  followers: "Follower count",
  verified: "Verified status",
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

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubInfo(data);
    } catch {
      // No subscription yet — that's fine
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
      }
      if (alertRes.data) setAlerts(alertRes.data);
      await checkSubscription();
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Register OneSignal push token when account first loads
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
          supabase
            .from("connected_accounts")
            .update({ push_token: playerId })
            .eq("user_id", user!.id);
        }
      })
      .catch((err: any) => console.error("[OneSignal]", err));
  }, [account?.id]);

  // Handle post-redirect states
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Subscription activated! Welcome to XSentinel.");
      checkSubscription();
    }
    if (searchParams.get("x_connected") === "1" && user) {
      supabase
        .from("connected_accounts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setAccount(data);
            setPushEnabled(data.push_enabled ?? true);
            setDigestEnabled(data.digest_enabled ?? true);
          }
        });
    }
  }, [searchParams, user]);

  const trialDaysLeft = subInfo?.trial_end
    ? Math.max(0, Math.ceil((new Date(subInfo.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : account?.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(account.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

  const subStatus = subInfo?.status || account?.subscription_status || "none";
  const isExpired = subStatus === "expired" || subStatus === "canceled" || subStatus === "past_due";
  const isTrial = subStatus === "trialing" || subStatus === "trial";
  const isActive = subStatus === "active";

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
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
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
      if (data?.url) {
        window.open(data.url, "_blank");
      }
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

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Shield className="h-8 w-8 text-foreground animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-in fade-in duration-300">
      {/* Header */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <img src="/logo-v2.png" alt="XSentinel" className="h-7 w-7" />
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Trial/Expired Banners */}
        {isTrial && trialDaysLeft > 5 && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Your free trial has started</p>
                <p className="text-sm text-muted-foreground mt-1">{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} to experience full protection. No credit card required to cancel.</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button size="sm" variant="outline" onClick={() => handleCheckout("yearly")} disabled={checkoutLoading} className="flex-1 md:flex-none">
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                $89/yr
              </Button>
              <Button size="sm" onClick={() => handleCheckout("monthly")} disabled={checkoutLoading} className="flex-1 md:flex-none">
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                $9/mo
              </Button>
            </div>
          </div>
        )}
        {isTrial && trialDaysLeft <= 5 && trialDaysLeft > 0 && (
          <div className="rounded-xl border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10 p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))]" />
            <p className="text-sm text-foreground">
              <span className="font-medium">
                {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}
              </span>{" "}
              left in your free trial.
            </p>
          </div>
        )}
        {isExpired && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Your subscription has ended</p>
                <p className="text-sm text-muted-foreground">Subscribe to keep your X account protected.</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => handleCheckout("yearly")} disabled={checkoutLoading}>
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                $89/yr
              </Button>
              <Button size="sm" onClick={() => handleCheckout("monthly")} disabled={checkoutLoading}>
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                $9/mo
              </Button>
            </div>
          </div>
        )}

        {/* Account Status Card */}
        {account ? (
          <GlowCard>
            <div className="p-8">
            <div className="flex items-center gap-4">
              <a
                href={`https://x.com/${account.x_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity shrink-0"
              >
                {account.x_avatar_url ? (
                  <img src={account.x_avatar_url} alt={account.x_username} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {account.x_username.charAt(0).toUpperCase()}
                  </span>
                )}
              </a>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-lg">{account.x_display_name || account.x_username}</p>
                <p className="text-sm text-muted-foreground">@{account.x_username}</p>
              </div>
              {isActive || isTrial ? (
                <div className="flex items-center gap-2 rounded-full bg-[hsl(var(--safe))]/15 px-4 py-2">
                  <ShieldCheck className="h-4 w-4 text-[hsl(var(--safe))]" />
                  <span className="text-sm font-medium text-[hsl(var(--safe))]">Protected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-full bg-destructive/15 px-4 py-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Unprotected</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              {account.followers_count != null && (
                <span>{account.followers_count.toLocaleString()} followers</span>
              )}
              {account.followers_count != null && account.last_checked_at && (
                <span className="text-border">·</span>
              )}
              {account.last_checked_at && (
                <span>Last checked {new Date(account.last_checked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              )}
            </div>
            {account.monitoring_error ? (
              <div className="mt-2 flex flex-col items-center gap-2">
                <p className="text-xs text-destructive font-medium">
                  ⚠ Monitoring paused — X token expired.
                </p>
                <Button size="sm" variant="outline" onClick={handleConnectX} disabled={connectXLoading} className="gap-1.5 text-xs h-7">
                  {connectXLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                  Reconnect X Account
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {isActive || isTrial
                  ? "Monitoring for unauthorized changes."
                  : "Subscribe to resume monitoring."}
              </p>
            )}
            </div>
          </GlowCard>
        ) : (
          <GlowCard>
            <div className="p-12 text-center">
              <Shield className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-foreground mb-3">Protect your X account</h2>
              {isTrial || isActive ? (
                <>
                  <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
                    Connect your X account via OAuth to start real-time monitoring against hacks
                  </p>
                  <Button
                    size="lg"
                    onClick={handleConnectX}
                    disabled={connectXLoading}
                    className="gap-2 px-10 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white"
                  >
                    {connectXLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <ExternalLink className="h-4 w-4" />}
                    {connectXLoading ? "Redirecting to X..." : "Connect my X Account"}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
                    Subscribe to start protecting your X account with real-time monitoring
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button size="lg" variant="outline" onClick={() => handleCheckout("yearly")} disabled={checkoutLoading} className="px-8">
                      {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      $89/yr
                    </Button>
                    <Button size="lg" onClick={() => handleCheckout("monthly")} disabled={checkoutLoading} className="px-8">
                      {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      $9/mo
                    </Button>
                  </div>
                </>
              )}
            </div>
          </GlowCard>
        )}

        {/* Recent Alerts */}
        <Separator />
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Alerts</h2>
          {alerts.length === 0 ? (
            <GlowCard>
              <div className="p-8 text-center">
              <ShieldCheck className="h-14 w-14 text-[hsl(var(--safe))] mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No alerts yet — everything looks good</p>
              </div>
            </GlowCard>
          
          ) : (
            <div className="max-h-[520px] overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-4 ${alert.is_legitimate ? "border-border bg-secondary/50" : "border-destructive/30 bg-destructive/5"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {eventLabels[alert.event_type] || alert.event_type} changed
                        </p>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {alert.created_at ? new Date(alert.created_at).toLocaleString() : ""}
                        </p>
                      </div>
                      {(() => {
                        const oldVal = alert.old_data?.[alert.event_type] ?? null;
                        const newVal = alert.new_data?.[alert.event_type] ?? null;
                        const isImage = alert.event_type === "profile_image" || alert.event_type === "banner";
                        const isFollowers = alert.event_type === "followers";
                        const imgClass = alert.event_type === "banner"
                          ? "h-8 w-14 rounded object-cover"
                          : "h-8 w-8 rounded-full object-cover";
                        if (isFollowers) {
                          const drop = (oldVal ?? 0) - (newVal ?? 0);
                          return (
                            <p className="mt-1 text-xs flex items-center gap-1.5">
                              <span className="text-destructive font-medium">−{drop.toLocaleString()} followers</span>
                              <span className="text-muted-foreground">({oldVal?.toLocaleString()} → {newVal?.toLocaleString()})</span>
                            </p>
                          );
                        }
                        return isImage ? (
                          <div className="mt-2 flex items-center gap-2">
                            {oldVal
                              ? <img src={oldVal} alt="before" className={imgClass} />
                              : <span className="text-xs italic text-muted-foreground">None</span>}
                            <span className="text-muted-foreground text-xs">→</span>
                            {newVal
                              ? <img src={newVal} alt="after" className={imgClass} />
                              : <span className="text-xs italic text-muted-foreground">None</span>}
                          </div>
                        ) : (
                          <div className="mt-1.5 space-y-0.5">
                            <p className="text-xs flex gap-1.5 min-w-0">
                              <span className="text-muted-foreground shrink-0">Before</span>
                              <span className="text-destructive line-through truncate">{oldVal ?? "—"}</span>
                            </p>
                            <p className="text-xs flex gap-1.5 min-w-0">
                              <span className="text-muted-foreground shrink-0">After</span>
                              <span className="text-[hsl(var(--safe))] truncate">{newVal ?? "—"}</span>
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                    {!alert.is_legitimate ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleThisWasMe(alert.id)}
                        className="text-xs shrink-0"
                      >
                        This was me
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">✓ Acknowledged</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <Separator />
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>

          <GlowCard>
            <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-foreground" />
                <div>
                  <Label className="text-foreground font-medium">Mobile push alerts</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {pushEnabled
                      ? "You'll receive instant push notifications on your phone when your X profile changes."
                      : "You'll still receive email alerts"}
                  </p>
                </div>
              </div>
              <Switch checked={pushEnabled} onCheckedChange={togglePush} disabled={!account} />
            </div>
            {!account && (
              <p className="text-xs text-muted-foreground italic pl-8">
                Connect your X account to enable push notifications.
              </p>
            )}
            </div>
          </GlowCard>

          <GlowCard>
            <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-foreground" />
                <div>
                  <Label className="text-foreground font-medium">Weekly digest</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {digestEnabled
                      ? "Receive a weekly summary of changes and monitoring activity."
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-foreground" />
                <div>
                  <Label className="text-foreground">Subscription</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isExpired
                      ? "Subscription ended — subscribe to continue"
                      : isTrial
                        ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left in trial`
                        : isActive
                          ? "Active — billed via Stripe"
                          : "Start with a 14-day free trial"}
                  </p>
                </div>
              </div>
              {(subInfo?.subscribed) ? (
                <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={portalLoading}>
                  {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Manage billing
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleCheckout("yearly")} disabled={checkoutLoading}>
                    {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    $89/yr
                  </Button>
                  <Button size="sm" onClick={() => handleCheckout("monthly")} disabled={checkoutLoading}>
                    {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    $9/mo
                  </Button>
                </div>
              )}
            </div>
            </div>
          </GlowCard>

          {account && (
            <GlowCard>
              <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Unplug className="h-5 w-5 text-destructive" />
                  <div>
                    <Label className="text-foreground">Disconnect X account</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Stop monitoring and remove your connected account
                    </p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDisconnect} className="shrink-0">
                  Disconnect
                </Button>
              </div>
              </div>
            </GlowCard>
          )}
        </div>

        {/* Footer */}
        <Separator />
        <div className="flex justify-center pt-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <Slash className="h-3 w-3" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/terms">Terms</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <Slash className="h-3 w-3" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/privacy">Privacy</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
