import { MinimalHeroBackground } from "@/components/ui/hero-minimalism";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen bg-background">
      <MinimalHeroBackground />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
