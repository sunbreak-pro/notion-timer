import { useMemo } from 'react';
import { BarChart3, CheckCircle2, Circle, FolderOpen } from 'lucide-react';
import { useTaskTreeContext } from '../../hooks/useTaskTreeContext';

export function AnalyticsView() {
  const { nodes } = useTaskTreeContext();

  const stats = useMemo(() => {
    const tasks = nodes.filter(n => n.type === 'task');
    const folders = nodes.filter(n => n.type === 'folder');
    const completed = tasks.filter(n => n.status === 'DONE');
    const incomplete = tasks.filter(n => n.status !== 'DONE');
    const completionRate = tasks.length > 0
      ? Math.round((completed.length / tasks.length) * 100)
      : 0;

    return {
      totalTasks: tasks.length,
      completedTasks: completed.length,
      incompleteTasks: incomplete.length,
      totalFolders: folders.length,
      completionRate,
    };
  }, [nodes]);

  return (
    <div className="h-full flex flex-col overflow-auto">
      <div className="max-w-3xl mx-auto w-full px-8 py-6">
        <h2 className="text-2xl font-bold text-notion-text mb-6">Analytics</h2>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard
            icon={<BarChart3 size={20} />}
            label="Total Tasks"
            value={stats.totalTasks}
            color="text-notion-accent"
          />
          <StatCard
            icon={<CheckCircle2 size={20} />}
            label="Completed"
            value={stats.completedTasks}
            color="text-notion-success"
          />
          <StatCard
            icon={<Circle size={20} />}
            label="In Progress"
            value={stats.incompleteTasks}
            color="text-yellow-500"
          />
          <StatCard
            icon={<FolderOpen size={20} />}
            label="Folders"
            value={stats.totalFolders}
            color="text-notion-text-secondary"
          />
        </div>

        {/* Completion rate bar */}
        <div className="bg-notion-bg-secondary rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-notion-text">Completion Rate</span>
            <span className="text-sm font-bold text-notion-accent">{stats.completionRate}%</span>
          </div>
          <div className="w-full h-3 bg-notion-border rounded-full overflow-hidden">
            <div
              className="h-full bg-notion-accent rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-notion-text-secondary mt-8 text-center">
          More detailed analytics coming soon.
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
