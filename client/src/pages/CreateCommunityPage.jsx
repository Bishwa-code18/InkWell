// pages/CreateCommunityPage.jsx — Create a new Inkwell community
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Globe, Lock, Eye, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateCommunityMutation } from '../services/communitiesApi';

const TYPES = [
  { id: 'public',     icon: Globe, label: 'Public',     desc: 'Anyone can view, post, and comment' },
  { id: 'restricted', icon: Eye,   label: 'Restricted', desc: 'Anyone can view, only members can post' },
  { id: 'private',    icon: Lock,  label: 'Private',    desc: 'Only approved members can view and post' },
];

const COLORS = ['#1A6B47','#2563EB','#7C3AED','#DC2626','#D97706','#0891B2','#BE185D','#374151'];

const schema = z.object({
  name:        z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, underscores'),
  displayName: z.string().min(3).max(60),
  description: z.string().max(300).optional(),
});

export default function CreateCommunityPage() {
  const navigate = useNavigate();
  const [type, setType]       = useState('public');
  const [color, setColor]     = useState('#1A6B47');
  const [topics, setTopics]   = useState([]);
  const [topicInput, setTopicInput] = useState('');

  const [createCommunity, { isLoading }] = useCreateCommunityMutation();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', displayName: '', description: '' },
  });

  const nameVal = watch('name');

  const addTopic = () => {
    const t = topicInput.trim().toLowerCase();
    if (t && !topics.includes(t) && topics.length < 10) {
      setTopics([...topics, t]);
      setTopicInput('');
    }
  };

  const onSubmit = async (values) => {
    try {
      const result = await createCommunity({ ...values, type, color, topics }).unwrap();
      toast.success(`s/${values.name} created! 🎉`);
      navigate(`/s/${values.name}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create community');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/communities" className="text-gray-400 hover:text-gray-600 text-sm">← Communities</Link>
        <h1 className="text-xl font-bold text-gray-900">Create a Community</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-sm text-gray-700 border-b border-gray-100 pb-3">Community Identity</h2>

          <div>
            <label className="label">Community Name</label>
            <div className="flex items-center gap-0">
              <span className="input w-auto rounded-r-none border-r-0 text-gray-400 px-3 bg-gray-50">s/</span>
              <input
                {...register('name')}
                placeholder="communityname"
                className={`input rounded-l-none flex-1 ${errors.name ? 'border-red-400' : ''}`}
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            <p className="text-xs text-gray-400 mt-1">Cannot be changed after creation. Letters, numbers, underscores only.</p>
          </div>

          <div>
            <label className="label">Display Name</label>
            <input
              {...register('displayName')}
              placeholder="e.g. Future Cities"
              className={`input ${errors.displayName ? 'border-red-400' : ''}`}
            />
            {errors.displayName && <p className="text-red-500 text-xs mt-1">{errors.displayName.message}</p>}
          </div>

          <div>
            <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="What is this community about?"
              className="input resize-none"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="label">Accent Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer border-0"
                title="Custom color"
              />
            </div>
            {/* Preview */}
            <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-[8px]">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: color }}
              >
                {nameVal?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">s/{nameVal || 'communityname'}</p>
                <p className="text-xs text-gray-400">Preview</p>
              </div>
            </div>
          </div>
        </div>

        {/* Type */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-sm text-gray-700">Community Type</h2>
          {TYPES.map(({ id, icon: Icon, label, desc }) => (
            <label
              key={id}
              className={`flex items-start gap-3 p-3 rounded-[8px] border cursor-pointer transition-all ${
                type === id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="type"
                value={id}
                checked={type === id}
                onChange={() => setType(id)}
                className="mt-0.5 accent-primary"
              />
              <Icon size={16} className={type === id ? 'text-primary mt-0.5' : 'text-gray-400 mt-0.5'} />
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Topics */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-sm text-gray-700">Topics <span className="text-gray-400 font-normal">(up to 10)</span></h2>
          <div className="flex flex-wrap gap-2">
            {topics.map(t => (
              <span key={t} className="badge badge-green flex items-center gap-1">
                {t}
                <button type="button" onClick={() => setTopics(topics.filter(x => x !== t))}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          {topics.length < 10 && (
            <div className="flex gap-2">
              <input
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTopic(); } }}
                placeholder="e.g. Technology, Science..."
                className="input flex-1"
              />
              <button type="button" onClick={addTopic} className="btn btn-outline btn-sm">
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={isLoading} className="btn btn-primary gap-2">
            {isLoading
              ? <span className="flex items-center gap-2"><span className="spinner w-4 h-4" />Creating...</span>
              : <><Users size={15} /> Create Community</>}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  );
}
