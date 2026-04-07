import { forwardRef, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

const ProtectedRoute = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const [hasConnectedAccounts, setHasConnectedAccounts] = useState<boolean | null>(null);
    const [onboardingDone, setOnboardingDone] = useState<boolean>(false);

    useEffect(() => {
      setOnboardingDone(localStorage.getItem("xsentinel_onboarding_done") === "1");
    }, []);

    useEffect(() => {
      if (user) {
        const checkAccounts = async () => {
          const { count } = await supabase
            .from("connected_accounts")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);
          setHasConnectedAccounts((count ?? 0) > 0);
        };
        checkAccounts();
      }
    }, [user]);

    if (loading || hasConnectedAccounts === null) {
      return (
        <div ref={ref} className="min-h-screen flex items-center justify-center">
          <Shield className="h-8 w-8 text-primary animate-pulse" />
        </div>
      );
    }

    if (!user) return <Navigate to="/login" replace />;

    // Show onboarding until user either connects an account or explicitly completes/skips onboarding
    if (!hasConnectedAccounts && !onboardingDone && location.pathname !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }

    return <div ref={ref}>{children}</div>;
  }
);

ProtectedRoute.displayName = "ProtectedRoute";

export default ProtectedRoute;
