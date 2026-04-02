import { statusConfig } from '../../data';

export function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, color: 'badge-gray' };
  return <span className={config.color}>{config.label}</span>;
}

export function NicheBadge({ niche }) {
  const colors = {
    Fashion: 'bg-pink-100 text-pink-700',
    Beauty: 'bg-rose-100 text-rose-700',
    Tech: 'bg-blue-100 text-blue-700',
    Fitness: 'bg-green-100 text-green-700',
    Food: 'bg-orange-100 text-orange-700',
    Travel: 'bg-sky-100 text-sky-700',
    Finance: 'bg-emerald-100 text-emerald-700',
    Lifestyle: 'bg-purple-100 text-purple-700',
    Gaming: 'bg-indigo-100 text-indigo-700',
    Education: 'bg-yellow-100 text-yellow-700',
    Health: 'bg-teal-100 text-teal-700',
    Wellness: 'bg-lime-100 text-lime-700',
    Skincare: 'bg-fuchsia-100 text-fuchsia-700',
    Business: 'bg-slate-100 text-slate-700',
  };
  return (
    <span className={`badge ${colors[niche] || 'bg-gray-100 text-gray-600'}`}>{niche}</span>
  );
}

export default function Badge({ children, variant = 'gray' }) {
  return <span className={`badge-${variant}`}>{children}</span>;
}
