import { forwardRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield } from "lucide-react";

const ProtectedRoute = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div ref={ref} className="min-h-screen flex items-center justify-center">
          <Shield className="h-8 w-8 text-primary animate-pulse" />
        </div>
      );
    }

    if (!user) return <Navigate to="/login" replace />;

    return <div ref={ref}>{children}</div>;
  }
);

ProtectedRoute.displayName = "ProtectedRoute";

export default ProtectedRoute;
