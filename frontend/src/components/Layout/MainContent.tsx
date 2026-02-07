import type { ReactNode } from "react";

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 h-screen overflow-auto bg-notion-bg">
      <div className="h-full mx-auto px-12 py-8">{children}</div>
    </main>
  );
}
