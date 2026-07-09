import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const widthMap = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

export function AppLayout({ children, maxWidth = "md" }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className={`mx-auto ${widthMap[maxWidth]} px-4 py-6 sm:px-6 sm:py-10`}>
        {children}
      </div>
    </div>
  );
}
