import { CheckSquare, Headphones, Settings } from "lucide-react";
import type { SectionId } from "../../types/navigation";

interface SidebarProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
}

const menuItems: { id: SectionId; label: string; icon: typeof CheckSquare }[] = [
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "session", label: "Session", icon: Headphones },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="w-60 h-screen bg-notion-bg-secondary border-r border-notion-border flex flex-col">
      <div className="p-4 border-b border-notion-border">
        <h1 className="text-lg font-semibold text-notion-text">Sonic Flow</h1>
      </div>
      <nav className="flex-1 p-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-notion-hover text-notion-text"
                  : "text-notion-text-secondary hover:bg-notion-hover hover:text-notion-text"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
