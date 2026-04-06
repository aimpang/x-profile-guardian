import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Alert {
  id: string;
  event_type: string;
  old_data: any;
  new_data: any;
  is_legitimate: boolean | null;
  created_at: string | null;
}

const eventLabels: Record<string, string> = {
  username: "Username",
  display_name: "Display name",
  bio: "Bio",
  profile_image: "Profile picture",
  banner: "Banner",
};

const Alerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setAlerts(data);
        setLoading(false);
      });
  }, [user]);

  const handleThisWasMe = async (id: string) => {
    await supabase.from("alerts").update({ is_legitimate: true }).eq("id", id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_legitimate: true } : a));
  };

  const allLegitimate = alerts.length > 0 && alerts.every(a => a.is_legitimate);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-6 py-4 flex items-center gap-4 max-w-5xl mx-auto">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Alerts</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {loading && (
          <div className="flex justify-center py-20">
            <Shield className="h-8 w-8 text-primary animate-pulse" />
          </div>
        )}

        {!loading && alerts.length === 0 && (
          <div className="rounded-2xl border border-border bg-secondary p-8 text-center">
            <ShieldCheck className="h-16 w-16 text-safe mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No alerts yet</h2>
            <p className="text-sm text-muted-foreground">Everything looks good — your account is secure.</p>
          </div>
        )}

        {!loading && allLegitimate && (
          <div className="rounded-xl border border-safe/20 bg-safe/5 p-4 mb-6 text-center">
            <p className="text-sm text-safe font-medium">All clear — all changes were made by you</p>
          </div>
        )}

        {!loading && alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map(alert => (
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
                        <span className="text-safe">{JSON.stringify(alert.new_data)}</span>
                      </div>
                    )}
                  </div>
                  {!alert.is_legitimate && (
                    <Button variant="outline" size="sm" onClick={() => handleThisWasMe(alert.id)} className="text-xs shrink-0 ml-4">
                      This was me
                    </Button>
                  )}
                  {alert.is_legitimate && (
                    <span className="text-xs text-muted-foreground">✓ Acknowledged</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
