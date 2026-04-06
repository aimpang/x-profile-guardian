import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/custom-toast";

const XOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [statusText, setStatusText] = useState("Connecting your X account...");

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get("error");
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (error) {
        toast.error("X authorization was denied or cancelled.");
        navigate("/dashboard");
        return;
      }

      if (!code || !state) {
        toast.error("Invalid callback — missing required parameters.");
        navigate("/dashboard");
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("x-oauth-callback", {
          body: { code, state },
        });

        if (fnError || data?.error) {
          throw new Error(fnError?.message || data?.error || "Failed to connect X account");
        }

        toast.success("X account connected! Monitoring is now active.");
        navigate("/dashboard?x_connected=1");
      } catch (err: any) {
        setStatusText("Something went wrong.");
        toast.error(err.message || "Failed to connect X account.");
        navigate("/dashboard");
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Shield className="h-10 w-10 text-primary animate-pulse" />
        <p className="text-sm text-muted-foreground">{statusText}</p>
      </div>
    </div>
  );
};

export default XOAuthCallback;
