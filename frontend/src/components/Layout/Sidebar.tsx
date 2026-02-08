import { CheckSquare, Headphones, Settings, Pencil } from "lucide-react";
import type { SectionId } from "../../types/navigation";
import { useTimerContext } from "../../hooks/useTimerContext";

interface SidebarProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  onOpenTimerModal: () => void;
}

const menuItems: { id: SectionId; label: string; icon: typeof CheckSquare }[] =
  [
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "session", label: "Session", icon: Headphones },
    { id: "settings", label: "Settings", icon: Settings },
  ];

export function Sidebar({
  activeSection,
  onSectionChange,
  onOpenTimerModal,
}: SidebarProps) {
  const timer = useTimerContext();
  const showTimer = timer.activeTask !== null || timer.isRunning;

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
            <div key={item.id}>
              <button
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

              {item.id === "session" && showTimer && (
                <div className="ml-3 mr-2 mb-1 px-3 py-2 rounded-md bg-notion-hover/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-notion-text-secondary truncate">
                        {timer.activeTask?.title ?? "Free Session"}
                      </p>
                      <p className="text-sm font-mono tabular-nums text-notion-accent">
                        {timer.formatTime(timer.remainingSeconds)}
                      </p>
                    </div>
                    <button
                      onClick={onOpenTimerModal}
                      className="p-1 text-notion-text-secondary hover:text-notion-text rounded transition-colors shrink-0 cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
