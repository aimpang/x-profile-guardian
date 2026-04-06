import { WebGLShader } from "@/components/ui/web-gl-shader";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed inset-0 z-0 overflow-hidden">
        <WebGLShader />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
