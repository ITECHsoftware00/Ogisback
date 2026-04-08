import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Megaphone, Plus, X, CheckCircle, DollarSign, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { createCampaign } from '../../lib/db';

const niches = ['Fashion', 'Beauty', 'Skincare', 'Tech', 'Gaming', 'Fitness', 'Health', 'Food', 'Travel', 'Finance', 'Lifestyle', 'Education', 'Wellness'];
const platforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'Facebook', 'LinkedIn'];
const contentTypes = ['Instagram Post', 'Instagram Reel', 'Instagram Story', 'TikTok Video', 'YouTube Video', 'YouTube Short', 'Carousel'];

export default function BrandNewCampaign() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '', description: '', niche: [], platforms: [], contentTypes: [],
    budgetMin: '', budgetMax: '', deadline: '', minFollowers: '',
    deliverables: [''], goals: '',
  });
  const [publishing, setPublishing] = useState(false);
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k, v) => update(k, form[k].includes(v) ? form[k].filter(x => x !== v) : [...form[k], v]);

  const handlePublish = async () => {
    if (!form.title.trim() || !form.description.trim()) { toast.error('Title and brief are required'); return; }
    if (!user?.id) { toast.error('Not logged in'); return; }
    setPublishing(true);
    try {
      await createCampaign(user.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        goals: form.goals || null,
        niche: form.niche,
        platforms: form.platforms,
        content_type: form.contentTypes[0] || null,
        deliverables: form.deliverables.filter(d => d.trim()),
        budget_min: parseFloat(form.budgetMin) || 0,
        budget_max: parseFloat(form.budgetMax) || 0,
        deadline: form.deadline || null,
        min_followers: parseInt(form.minFollowers) || 0,
        status: 'active',
      });
      toast.success('Campaign published! Creators can now apply.');
      navigate('/brand/campaigns');
    } catch (err) {
      toast.error(err.message || 'Failed to publish campaign');
    } finally {
      setPublishing(false);
    }
  };

  const steps = ['Campaign Info', 'Requirements', 'Budget & Timeline', 'Review'];

  return (
    <DashboardLayout>
      <SEO title="Create Campaign" noindex={true} />
      <div className="max-w-2xl mx-auto">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2"><Megaphone size={22} className="text-brand" />New Campaign</h1>
          <p className="page-subtitle">Post a campaign brief to find the perfect creators</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-0 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <button onClick={() => setStep(i + 1)} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step > i + 1 ? 'bg-brand text-white' : step === i + 1 ? 'bg-brand text-white ring-4 ring-brand/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  {step > i + 1 ? <CheckCircle size={16} /> : i + 1}
                </div>
                <p className="text-[10px] text-gray-500 mt-1 hidden sm:block">{s}</p>
              </button>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-5 transition-all ${step > i + 1 ? 'bg-brand' : 'bg-gray-100 dark:bg-gray-800'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="card p-6 space-y-4">
              <div className="form-group">
                <label className="label">Campaign Title *</label>
                <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Summer Skincare Launch 2025" className="input" />
              </div>
              <div className="form-group">
                <label className="label">Campaign Brief *</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe your campaign goals, product/service, target audience, and what you're looking for in a creator..." rows={5} className="input resize-none" />
              </div>
              <div className="form-group">
                <label className="label">Campaign Goals</label>
                <input value={form.goals} onChange={e => update('goals', e.target.value)} placeholder="Brand awareness, product launch, sales, app downloads..." className="input" />
              </div>
            </div>
            <div className="card p-6">
              <label className="label mb-3">Target Niches</label>
              <div className="flex flex-wrap gap-2">
                {niches.map(n => (
                  <button key={n} onClick={() => toggleArr('niche', n)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.niche.includes(n) ? 'bg-brand text-white border-brand' : 'border-gray-200 dark:border-gray-700 text-gray-600 hover:border-brand/50'}`}>
                    {form.niche.includes(n) && <CheckCircle size={11} className="inline mr-1" />}{n}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="card p-6">
              <label className="label mb-3">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {platforms.map(p => (
                  <button key={p} onClick={() => toggleArr('platforms', p)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.platforms.includes(p) ? 'bg-brand text-white border-brand' : 'border-gray-200 dark:border-gray-700 text-gray-600 hover:border-brand/50'}`}>{p}</button>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <label className="label mb-3">Content Types Required</label>
              <div className="flex flex-wrap gap-2">
                {contentTypes.map(ct => (
                  <button key={ct} onClick={() => toggleArr('contentTypes', ct)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.contentTypes.includes(ct) ? 'bg-brand text-white border-brand' : 'border-gray-200 dark:border-gray-700 text-gray-600 hover:border-brand/50'}`}>{ct}</button>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <label className="label">Minimum Followers</label>
              <input type="number" value={form.minFollowers} onChange={e => update('minFollowers', e.target.value)} placeholder="e.g. 50000" className="input" />
            </div>
            <div className="card p-6">
              <label className="label mb-3">Deliverables</label>
              {form.deliverables.map((d, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={d} onChange={e => { const arr = [...form.deliverables]; arr[i] = e.target.value; update('deliverables', arr); }} placeholder={`Deliverable ${i + 1}`} className="input flex-1" />
                  {form.deliverables.length > 1 && <button onClick={() => update('deliverables', form.deliverables.filter((_, j) => j !== i))} className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all"><X size={16} /></button>}
                </div>
              ))}
              <button onClick={() => update('deliverables', [...form.deliverables, ''])} className="btn btn-ghost btn-sm mt-2"><Plus size={14} />Add Deliverable</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="card p-6 space-y-4">
              <h2 className="section-title">Budget Range</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Minimum ($)</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input type="number" value={form.budgetMin} onChange={e => update('budgetMin', e.target.value)} placeholder="500" className="input pl-8" /></div>
                </div>
                <div className="form-group">
                  <label className="label">Maximum ($)</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input type="number" value={form.budgetMax} onChange={e => update('budgetMax', e.target.value)} placeholder="5000" className="input pl-8" /></div>
                </div>
              </div>
              <div className="rounded-xl bg-wallet/5 border border-wallet/20 p-3 text-xs text-gray-600 dark:text-gray-400">
                💰 Funds will be collected per creator hire and held in secure escrow until content approval.
              </div>
            </div>
            <div className="card p-6">
              <label className="label">Application Deadline</label>
              <div className="relative"><Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} className="input pl-10" /></div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-6 space-y-4">
            <h2 className="section-title">Campaign Review</h2>
            {[
              { label: 'Title', value: form.title || '—' },
              { label: 'Niches', value: form.niche.join(', ') || '—' },
              { label: 'Platforms', value: form.platforms.join(', ') || '—' },
              { label: 'Budget', value: form.budgetMin && form.budgetMax ? `$${form.budgetMin} – $${form.budgetMax}` : '—' },
              { label: 'Deadline', value: form.deadline || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-xs">{value}</span>
              </div>
            ))}
          </motion.div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 1 && <button onClick={() => setStep(s => s - 1)} className="btn btn-outline btn-lg">Back</button>}
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} className="btn btn-brand btn-lg flex-1">Continue →</button>
          ) : (
            <button onClick={handlePublish} disabled={publishing} className="btn btn-brand btn-lg flex-1 disabled:opacity-70">
              {publishing ? 'Publishing...' : <><Megaphone size={16} />Publish Campaign</>}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
