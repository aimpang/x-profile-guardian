import { forwardRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield } from "lucide-react";
import { ONBOARDING_KEY } from "@/pages/Onboarding";

const ProtectedRoute = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
      return (
        <div ref={ref} className="min-h-screen flex items-center justify-center">
          <Shield className="h-8 w-8 text-primary animate-pulse" />
        </div>
      );
    }

    if (!user) return <Navigate to="/login" replace />;

    // First-time users → onboarding (skip if already on /onboarding)
    if (!localStorage.getItem(ONBOARDING_KEY) && location.pathname !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }

    return <div ref={ref}>{children}</div>;
  }
);

ProtectedRoute.displayName = "ProtectedRoute";

export default ProtectedRoute;
