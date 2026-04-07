import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/custom-toast";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    setReverseCanvasVisible(true);
    setTimeout(() => setInitialCanvasVisible(false), 50);
    setTimeout(() => {
      setStep("success");
      toast.success("Welcome back!");
      setTimeout(() => navigate("/dashboard"), 1500);
    }, 2000);
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error("Google sign-in failed");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Canvas backgrounds */}
      <div className="absolute inset-0">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={5}
              containerClassName="bg-transparent"
              colors={[[255, 255, 255]]}
              opacities={[0.1, 0.1, 0.1, 0.15, 0.15, 0.15, 0.2, 0.2, 0.2, 0.3]}
              dotSize={3}
              showGradient={true}
            />
          </div>
        )}
        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={15}
              containerClassName="bg-transparent"
              colors={[[255, 255, 255]]}
              opacities={[0.1, 0.1, 0.1, 0.15, 0.15, 0.15, 0.2, 0.2, 0.2, 0.3]}
              dotSize={3}
              showGradient={false}
              reverse={true}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-background/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Header */}
                <div className="flex flex-col items-center gap-2 mb-8">
                  <Shield className="h-8 w-8 text-foreground" />
                  <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
                  <p className="text-sm text-muted-foreground text-center">
                    Sign in to your XSentinel account
                  </p>
                </div>

                {/* Google */}
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2 rounded-full py-3 px-4 border border-border/50 bg-secondary/30 backdrop-blur-sm text-foreground text-sm font-medium hover:bg-secondary/50 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="currentColor" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
                  </svg>
                  Sign in with Google
                </button>

                {/* Divider */}
                <div className="my-6 flex items-center gap-3">
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>

                {/* Email + Password */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full backdrop-blur-sm text-foreground border border-border/50 bg-secondary/20 rounded-full py-3 px-4 focus:outline-none focus:border-foreground/30 text-center text-sm"
                    />
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full backdrop-blur-sm text-foreground border border-border/50 bg-secondary/20 rounded-full py-3 px-4 focus:outline-none focus:border-foreground/30 text-center text-sm"
                    />
                    {email && password.length >= 6 && (
                      <button
                        type="submit"
                        disabled={loading}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors disabled:opacity-50"
                      >
                        <span className="text-sm font-bold">→</span>
                      </button>
                    )}
                  </div>
                  {(!email || password.length < 6) && (
                    <button
                      type="submit"
                      disabled={loading || !email || password.length < 6}
                      className="w-full rounded-full py-3 px-4 bg-secondary/30 border border-border/50 text-muted-foreground text-sm font-medium cursor-not-allowed opacity-50"
                    >
                      {loading ? "Signing in..." : "Sign in"}
                    </button>
                  )}
                </form>

                {/* Footer */}
                <p className="text-sm text-muted-foreground text-center mt-6">
                  No account?{" "}
                  <Link to="/signup" className="text-foreground hover:underline font-medium">
                    Create an account
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Welcome back!</h2>
                  <p className="text-muted-foreground mt-1">Redirecting to dashboard...</p>
                </div>
                <div className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center mb-6">
                  <motion.svg
                    className="w-8 h-8 text-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M5 13l4 4L19 7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    />
                  </motion.svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Login;
