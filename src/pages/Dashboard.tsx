import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, ShieldCheck, Bell, Settings, LogOut, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<ConnectedAccount | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [accRes, alertRes] = await Promise.all([
        supabase.from("connected_accounts").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      if (accRes.data) setAccount(accRes.data);
      if (alertRes.data) setAlerts(alertRes.data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const trialDaysLeft = account?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(account.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isExpired = account?.subscription_status === "expired";
  const isTrial = account?.subscription_status === "trial";

  const handleConnectX = () => {
    toast.info("X OAuth integration coming soon. This will connect your X account via OAuth.");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Shield className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">XGuard</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/alerts">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Bell className="h-4 w-4" /> Alerts
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Settings className="h-4 w-4" /> Settings
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Trial / Expired banner */}
        {isExpired && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Your trial has ended</p>
              <p className="text-sm text-muted-foreground">Subscribe to keep your X account protected.</p>
              <Button size="sm" className="mt-3">Subscribe — $9/month</Button>
            </div>
          </div>
        )}
        {isTrial && trialDaysLeft <= 5 && trialDaysLeft > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-sm text-foreground">
              <span className="font-medium">{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}</span> left in your free trial.
            </p>
          </div>
        )}

        {/* Connected account card */}
        {account ? (
          <div className="rounded-2xl border border-border bg-secondary p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {account.x_avatar_url ? (
                  <img src={account.x_avatar_url} alt={account.x_username} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-muted-foreground">
                    {account.x_username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-lg">
                  {account.x_display_name || account.x_username}
                </p>
                <p className="text-sm text-muted-foreground">@{account.x_username}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-safe/15 px-3 py-1.5">
                <ShieldCheck className="h-4 w-4 text-safe" />
                <span className="text-sm font-medium text-safe">Protected</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-secondary p-8 mb-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Connect your X account</h2>
            <p className="text-sm text-muted-foreground mb-6">Authorize via OAuth so we can monitor your profile for unauthorized changes.</p>
            <Button onClick={handleConnectX} className="gap-2">
              <ExternalLink className="h-4 w-4" /> Connect my X Account
            </Button>
          </div>
        )}

        {/* Protected state or recent alerts */}
        {account && alerts.length === 0 && (
          <div className="rounded-2xl border border-border bg-secondary p-8 text-center">
            <ShieldCheck className="h-16 w-16 text-safe mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Protected ✓</h2>
            <p className="text-sm text-muted-foreground">We're monitoring for any unauthorized changes.</p>
          </div>
        )}

        {account && alerts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent alerts</h2>
              <Link to="/alerts" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {alerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const eventLabels: Record<string, string> = {
  username: "Username",
  display_name: "Display name",
  bio: "Bio",
  profile_image: "Profile picture",
  banner: "Banner",
};

const AlertCard = ({ alert }: { alert: Alert }) => {
  const [dismissed, setDismissed] = useState(alert.is_legitimate);

  const handleThisWasMe = async () => {
    await supabase.from("alerts").update({ is_legitimate: true }).eq("id", alert.id);
    setDismissed(true);
  };

  return (
    <div className={`rounded-xl border p-4 ${dismissed ? "border-border bg-secondary/50" : "border-destructive/30 bg-destructive/5"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {eventLabels[alert.event_type] || alert.event_type} changed
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : ""}
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
              <span className="text-safe">{JSON.stringify(alert.new_data)}</span>
            </div>
          )}
        </div>
        {!dismissed && (
          <Button variant="outline" size="sm" onClick={handleThisWasMe} className="text-xs shrink-0 ml-4">
            This was me
          </Button>
        )}
        {dismissed && (
          <span className="text-xs text-muted-foreground">✓ Acknowledged</span>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
