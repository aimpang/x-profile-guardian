import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Bell, CreditCard, Unplug } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/custom-toast";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("connected_accounts")
      .select("push_enabled")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setHasAccount(true);
          setPushEnabled(data.push_enabled ?? true);
        }
        setLoading(false);
      });
  }, [user]);

  const togglePush = async (val: boolean) => {
    setPushEnabled(val);
    await supabase.from("connected_accounts").update({ push_enabled: val }).eq("user_id", user!.id);
    toast.success(val ? "Push alerts enabled" : "Push alerts disabled — you'll still receive emails");
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure? This will stop monitoring your X account.")) return;
    await supabase.from("connected_accounts").delete().eq("user_id", user!.id);
    toast.success("X account disconnected");
    navigate("/dashboard");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("This will permanently delete your account and all data. Are you sure?")) return;
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Shield className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border px-6 py-4 flex items-center gap-4 max-w-5xl mx-auto">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Settings</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-10 space-y-6">
        {/* Push notifications */}
        {hasAccount && (
          <GlowCard>
            <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Notifications</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Mobile push alerts</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pushEnabled ? "You'll receive push & email alerts" : "You'll still receive email alerts"}
                </p>
              </div>
              <Switch checked={pushEnabled} onCheckedChange={togglePush} />
            </div>
          </div>
        )}

        {/* Billing */}
        <div className="rounded-xl border border-border bg-secondary/50 backdrop-blur-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Billing</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Manage your subscription and payment method.</p>
          <Button variant="outline" size="sm" onClick={() => toast.info("Stripe billing portal coming soon")}>
            Manage billing
          </Button>
        </div>

        {/* Disconnect X */}
        {hasAccount && (
          <div className="rounded-xl border border-border bg-secondary/50 backdrop-blur-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <Unplug className="h-5 w-5 text-destructive" />
              <h2 className="font-semibold text-foreground">Disconnect X account</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Stop monitoring and remove your connected X account.</p>
            <Button variant="destructive" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        )}

        {/* Account */}
        <div className="rounded-xl border border-border bg-secondary/50 backdrop-blur-sm p-5">
          <h2 className="font-semibold text-foreground mb-3">Account</h2>
          <p className="text-sm text-muted-foreground mb-1">{user?.email}</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => { signOut(); navigate("/"); }}>
              Log out
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
              Delete account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
