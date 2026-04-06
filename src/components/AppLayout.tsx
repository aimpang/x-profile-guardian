import { EtherealBeamsBackground } from "@/components/ui/ethereal-beams";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen bg-background">
      <EtherealBeamsBackground />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
