import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Shield,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  Bell,
  CreditCard,
  Unplug,
  LogOut,
  Slash,
  Loader2,
} from "lucide-react";
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
import { toast } from "sonner";

interface ConnectedAccount {
  id: string;
  x_username: string;
  x_display_name: string | null;
  x_avatar_url: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  push_enabled: boolean | null;
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
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [account, setAccount] = useState<ConnectedAccount | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

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
        supabase.from("alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      if (accRes.data) {
        setAccount(accRes.data);
        setPushEnabled(accRes.data.push_enabled ?? true);
      }
      if (alertRes.data) setAlerts(alertRes.data);
      await checkSubscription();
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Handle checkout success redirect
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Subscription activated! Welcome to XGuard.");
      checkSubscription();
    }
  }, [searchParams]);

  const trialDaysLeft = subInfo?.trial_end
    ? Math.max(0, Math.ceil((new Date(subInfo.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : account?.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(account.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

  const subStatus = subInfo?.status || account?.subscription_status || "none";
  const isExpired = subStatus === "expired" || subStatus === "canceled" || subStatus === "past_due";
  const isTrial = subStatus === "trialing" || subStatus === "trial";
  const isActive = subStatus === "active";

  const handleConnectX = () => {
    toast.info("X OAuth integration coming soon. This will connect your X account via OAuth.");
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
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
    <div className="min-h-screen">
      {/* Header */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm tracking-widest uppercase text-muted-foreground">XGuard</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Trial/Expired Banners */}
        {isExpired && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Your subscription has ended</p>
              <p className="text-sm text-muted-foreground">Subscribe to keep your X account protected.</p>
              <Button size="sm" className="mt-3" onClick={handleCheckout} disabled={checkoutLoading}>
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Subscribe — $9/month
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

        {/* Account Status Card */}
        {account ? (
          <div className="rounded-2xl border border-border bg-secondary/50 backdrop-blur-sm p-8">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {account.x_avatar_url ? (
                  <img src={account.x_avatar_url} alt={account.x_username} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {account.x_username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-lg">{account.x_display_name || account.x_username}</p>
                <p className="text-sm text-muted-foreground">@{account.x_username}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-[hsl(var(--safe))]/15 px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--safe))]" />
                <span className="text-sm font-medium text-[hsl(var(--safe))]">Protected</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              We're monitoring for any unauthorized changes.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-secondary/50 backdrop-blur-sm p-12 text-center">
            <Shield className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-foreground mb-3">Protect your X account</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
              Connect your X account via OAuth to start real-time protection against hacks
            </p>
            <Button
              size="lg"
              onClick={handleConnectX}
              className="gap-2 px-10 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white"
            >
              <ExternalLink className="h-4 w-4" /> Connect my X Account
            </Button>
          </div>
        )}

        {/* Recent Alerts */}
        <Separator />
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Alerts</h2>
          {alerts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-secondary/50 backdrop-blur-sm p-8 text-center">
              <ShieldCheck className="h-14 w-14 text-[hsl(var(--safe))] mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No alerts yet — everything looks good</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-4 ${alert.is_legitimate ? "border-border bg-secondary/50" : "border-destructive/30 bg-destructive/5"}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {eventLabels[alert.event_type] || alert.event_type} changed
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.created_at ? new Date(alert.created_at).toLocaleString() : ""}
                      </p>
                      {alert.old_data && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground">Before: </span>
                          <span className="text-destructive line-through">{JSON.stringify(alert.old_data)}</span>
                        </div>
                      )}
                      {alert.new_data && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">After: </span>
                          <span className="text-[hsl(var(--safe))]">{JSON.stringify(alert.new_data)}</span>
                        </div>
                      )}
                    </div>
                    {!alert.is_legitimate ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleThisWasMe(alert.id)}
                        className="text-xs shrink-0 ml-4"
                      >
                        This was me
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">✓ Acknowledged</span>
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

          <div className="rounded-xl border border-border bg-secondary/50 backdrop-blur-sm p-5 space-y-3">
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

          <div className="rounded-xl border border-border bg-secondary/50 backdrop-blur-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="h-5 w-5 text-foreground" />
              <div>
                <Label className="text-foreground">Subscription</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isExpired
                    ? "Subscription ended — subscribe to continue"
                    : isTrial
                      ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left in trial`
                      : isActive
                        ? "Active — $9/month"
                        : "Start with a 14-day free trial"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {(subInfo?.subscribed) ? (
                <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={portalLoading}>
                  {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Manage billing
                </Button>
              ) : (
                <Button size="sm" onClick={handleCheckout} disabled={checkoutLoading}>
                  {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Subscribe — $9/month
                </Button>
              )}
            </div>
          </div>

          {account && (
            <div className="rounded-xl border border-border bg-secondary/50 backdrop-blur-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <Unplug className="h-5 w-5 text-destructive" />
                <div>
                  <Label className="text-foreground">Disconnect X account</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Stop monitoring and remove your connected account
                  </p>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
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
