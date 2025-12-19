import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  count: number;
  color: 'terracotta' | 'moss' | 'river';
}

const colorClasses = {
  terracotta: 'bg-terracotta/10 text-terracotta',
  moss: 'bg-moss/10 text-moss',
  river: 'bg-river/10 text-river',
};

export function StatCard({ icon: Icon, label, count, color }: StatCardProps) {
  return (
    <div className="bg-cream rounded-xl p-4 border border-forest/10 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-display font-bold text-forest">{count}</p>
          <p className="text-sm text-bark/60 font-body">{label}</p>
        </div>
      </div>
    </div>
  );
}
