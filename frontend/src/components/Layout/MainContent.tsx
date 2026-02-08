import type { ReactNode } from "react";

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 h-screen overflow-auto bg-notion-bg">
      <div className="h-auto mx-auto px-12 py-20">{children}</div>
    </main>
  );
}
