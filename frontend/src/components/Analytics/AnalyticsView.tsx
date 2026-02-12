import { useMemo } from "react";
import { BarChart3, CheckCircle2, Circle, FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTaskTreeContext } from "../../hooks/useTaskTreeContext";

export function AnalyticsView() {
  const { t } = useTranslation();
  const { nodes } = useTaskTreeContext();
  const stats = useMemo(() => {
    const tasks = nodes.filter((n) => n.type === "task");
    const folders = nodes.filter((n) => n.type === "folder");
    const completed = tasks.filter((n) => n.status === "DONE");
    const incomplete = tasks.filter((n) => n.status !== "DONE");
    const completionRate =
      tasks.length > 0
        ? Math.round((completed.length / tasks.length) * 100)
        : 0;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayTasks = tasks.filter(
      (t) => (t.scheduledAt ?? t.createdAt)?.substring(0, 10) === todayStr,
    );
    const todayCompleted = todayTasks.filter((t) => t.status === "DONE");
    const todayCompletionRate =
      todayTasks.length > 0
        ? Math.round((todayCompleted.length / todayTasks.length) * 100)
        : 0;

    return {
      totalTasks: tasks.length,
      completedTasks: completed.length,
      incompleteTasks: incomplete.length,
      totalFolders: folders.length,
      completionRate,
      todayTotal: todayTasks.length,
      todayCompleted: todayCompleted.length,
      todayCompletionRate,
    };
  }, [nodes]);

  return (
    <div className="h-full flex flex-col overflow-auto">
      <div className="max-w-3xl mx-auto w-full px-8 py-6">
        <h2 className="text-2xl font-bold text-notion-text mb-6">{t('analytics.title')}</h2>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard
            icon={<BarChart3 size={20} />}
            label={t('analytics.totalTasks')}
            value={stats.totalTasks}
            color="text-notion-accent"
          />
          <StatCard
            icon={<CheckCircle2 size={20} />}
            label={t('analytics.completed')}
            value={stats.completedTasks}
            color="text-notion-success"
          />
          <StatCard
            icon={<Circle size={20} />}
            label={t('analytics.inProgress')}
            value={stats.incompleteTasks}
            color="text-yellow-500"
          />
          <StatCard
            icon={<FolderOpen size={20} />}
            label={t('analytics.folders')}
            value={stats.totalFolders}
            color="text-notion-text-secondary"
          />
        </div>

        <div className="bg-notion-bg-secondary rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-notion-text">
              {t('analytics.todayRate')}
            </span>
            <span className="text-sm font-bold text-notion-success">
              {stats.todayCompletionRate}%
              <span className="text-xs font-normal text-notion-text-secondary ml-1">
                ({stats.todayCompleted}/{stats.todayTotal})
              </span>
            </span>
          </div>
          <div className="w-full h-3 bg-notion-border rounded-full overflow-hidden">
            <div
              className="h-full bg-notion-success rounded-full transition-all duration-500"
              style={{ width: `${stats.todayCompletionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-notion-bg-secondary rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-notion-text">
              {t('analytics.totalRate')}
            </span>
            <span className="text-sm font-bold text-notion-accent">
              {stats.completionRate}%
            </span>
          </div>
          <div className="w-full h-3 bg-notion-border rounded-full overflow-hidden">
            <div
              className="h-full bg-notion-accent rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-notion-text-secondary mt-8 text-center">
          {t('analytics.comingSoon')}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-notion-bg-secondary rounded-lg p-4 flex items-center gap-3">
      <div className={color}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-notion-text">{value}</p>
        <p className="text-xs text-notion-text-secondary">{label}</p>
      </div>
    </div>
  );
}
