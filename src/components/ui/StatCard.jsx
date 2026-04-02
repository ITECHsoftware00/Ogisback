import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'primary', delay = 0 }) {
  const colorMap = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', icon: 'text-primary' },
    creator: { bg: 'bg-creator/10', text: 'text-creator', icon: 'text-creator' },
    brand: { bg: 'bg-brand/10', text: 'text-brand', icon: 'text-brand' },
    wallet: { bg: 'bg-wallet/10', text: 'text-wallet', icon: 'text-wallet' },
    success: { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-600' },
  };
  const c = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="stat-card group"
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          {Icon && <Icon size={20} className={c.icon} />}
        </div>
        {trendValue !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trendValue}%
          </span>
        )}
      </div>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
