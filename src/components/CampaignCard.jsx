import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, DollarSign, ArrowRight } from 'lucide-react';
import { NicheBadge } from './ui/Badge';
import { useAuth } from '../context/AuthContext';

export default function CampaignCard({ campaign, onApply, linkPrefix = '/creator/campaigns' }) {
  const { isCreator } = useAuth();
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline) - Date.now()) / 86400000));

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="card overflow-hidden group"
    >
      {/* Cover image */}
      <div className="relative h-40 overflow-hidden">
        <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2">
            <img src={campaign.brandLogo} alt={campaign.brand} className="w-7 h-7 rounded-lg object-cover" />
            <span className="text-white text-sm font-semibold">{campaign.brand}</span>
          </div>
        </div>
        {campaign.status === 'active' && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Active</div>
        )}
        {campaign.status === 'completed' && (
          <div className="absolute top-2 right-2 bg-gray-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Closed</div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-heading font-bold text-sm text-gray-900 dark:text-white mb-1 line-clamp-1">{campaign.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{campaign.description}</p>

        {/* Niches */}
        <div className="flex flex-wrap gap-1 mb-3">
          {campaign.niche.slice(0, 3).map(n => <NicheBadge key={n} niche={n} />)}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100 dark:border-gray-800 mb-3">
          <div className="flex flex-col items-center">
            <DollarSign size={13} className="text-wallet mb-0.5" />
            <p className="text-xs font-bold text-gray-900 dark:text-white">${campaign.budget.min.toLocaleString()}+</p>
            <p className="text-[10px] text-gray-500">Budget</p>
          </div>
          <div className="flex flex-col items-center">
            <Calendar size={13} className="text-brand mb-0.5" />
            <p className="text-xs font-bold text-gray-900 dark:text-white">{daysLeft}d</p>
            <p className="text-[10px] text-gray-500">Remaining</p>
          </div>
          <div className="flex flex-col items-center">
            <Users size={13} className="text-primary mb-0.5" />
            <p className="text-xs font-bold text-gray-900 dark:text-white">{campaign.applicants}</p>
            <p className="text-[10px] text-gray-500">Applied</p>
          </div>
        </div>

        {/* CTA */}
        {isCreator ? (
          <button
            onClick={() => onApply && onApply(campaign)}
            disabled={campaign.status !== 'active'}
            className="btn btn-creator btn-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {campaign.status === 'active' ? 'Apply Now' : 'Closed'}
            <ArrowRight size={13} />
          </button>
        ) : (
          <Link to={`/brand/campaigns/${campaign.id}`} className="btn btn-brand btn-sm w-full">
            View Campaign <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
