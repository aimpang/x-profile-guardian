import { GridVignetteBackground } from "@/components/ui/vignette-grid-background";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed inset-0 z-0">
        <GridVignetteBackground />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
