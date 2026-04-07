import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const Navbar = ({ showAuthButtons = false }: { showAuthButtons?: boolean }) => {
  const { user } = useAuth();

  return (
    <nav className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto border-b border-border/50">
      <Link to="/">
        <span className="text-sm font-semibold tracking-widest text-foreground hover:opacity-80 transition-opacity">XSENTINEL</span>
      </Link>
      <div className="flex items-center gap-3">
        {showAuthButtons ? (
          user ? (
            <Link to="/dashboard">
              <Button size="sm" variant="outline" className="border-border bg-secondary/50 text-foreground">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button size="sm" variant="ghost" className="text-foreground">
                Already have an account? Log in
              </Button>
            </Link>
          )
        ) : user ? (
          <Link to="/dashboard">
            <Button size="sm" variant="outline" className="border-border bg-secondary/50 text-foreground">
              Dashboard
            </Button>
          </Link>
        ) : null}
      </div>
    </nav>
  );
};
