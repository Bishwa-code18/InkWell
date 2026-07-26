// pages/CreatePostPage.jsx — Create post with Cloudinary image upload, community picker, tags
import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Link2, Image, X, Plus, ChevronDown, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreatePostMutation } from '../services/postsApi';
import { useGetCommunitiesQuery } from '../services/communitiesApi';
import ImageUpload from '../components/shared/ImageUpload';

const POST_TYPES = [
  { id: 'text',  label: 'Text',  icon: FileText },
  { id: 'link',  label: 'Link',  icon: Link2 },
  { id: 'image', label: 'Image', icon: Image },
];

const schema = z.object({
  title:     z.string().min(5, 'Title must be at least 5 characters').max(300),
  content:   z.string().optional(),
  url:       z.string().url('Must be a valid URL').optional().or(z.literal('')),
  community: z.string().optional(),
}).refine((d) => {
  if (d.url && d.url !== '') {
    try { new URL(d.url); return true; } catch { return false; }
  }
  return true;
}, { message: 'Invalid URL', path: ['url'] });

export default function CreatePostPage() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const presetCommunity = searchParams.get('community') || '';

  const [type, setType]             = useState('text');
  const [tags, setTags]             = useState([]);
  const [tagInput, setTagInput]     = useState('');
  const [communityOpen, setCommunityOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null); // { url, publicId }

  const { data: communitiesData } = useGetCommunitiesQuery({ limit: 50 });
  const communities = communitiesData?.communities || [];

  const [createPost, { isLoading }] = useCreatePostMutation();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title:     '',
      content:   '',
      url:       '',
      community: presetCommunity,
    },
  });

  const selectedCommunity = watch('community');
  const titleLen          = watch('title')?.length ?? 0;

  const selectedCommunityObj = communities.find(c =>
    c._id === selectedCommunity || c.slug === selectedCommunity
  );

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const onSubmit = async (values) => {
    if (type === 'link' && !values.url) {
      toast.error('Please provide a URL for link posts');
      return;
    }
    if (type === 'image' && !uploadedImage?.url) {
      toast.error('Please upload an image');
      return;
    }

    try {
      const payload = {
        title:     values.title,
        content:   type === 'text' ? values.content : undefined,
        url:       type === 'link' ? values.url : undefined,
        imageUrl:  type === 'image' ? uploadedImage?.url : undefined,
        community: values.community || undefined,
        type,
        tags,
      };

      const result = await createPost(payload).unwrap();
      toast.success('Post published! 🎉');
      navigate(`/post/${result.post._id}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create post');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">← Home</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Create a Post</h1>
      </div>

      {/* Community selector */}
      <div className="card mb-4 p-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setCommunityOpen(!communityOpen)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors w-full"
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: selectedCommunityObj?.color || '#1A6B47' }}
            >
              {selectedCommunityObj ? selectedCommunityObj.displayName?.charAt(0).toUpperCase() : 'S'}
            </div>
            <span className="flex-1 text-left">
              {selectedCommunityObj
                ? `s/${selectedCommunityObj.slug}`
                : 'Choose a community (optional)'}
            </span>
            <ChevronDown size={14} className={`transition-transform ${communityOpen ? 'rotate-180' : ''}`} />
          </button>

          {communityOpen && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-[8px] shadow-xl z-20 max-h-52 overflow-y-auto">
              <div
                className="px-3 py-2.5 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => { setValue('community', ''); setCommunityOpen(false); }}
              >
                No community (personal post)
              </div>
              {communities.map((c) => (
                <div
                  key={c._id}
                  className="px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2.5"
                  onClick={() => { setValue('community', c._id); setCommunityOpen(false); }}
                >
                  <div
                    className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: c.color || '#1A6B47' }}
                  >
                    {c.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-700 truncate">s/{c.slug}</p>
                    <p className="text-xs text-gray-400">{c.memberCount?.toLocaleString()} members</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        {/* Type selector */}
        <div className="flex border-b border-gray-200 mb-5 -mx-5 px-5">
          {POST_TYPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setType(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                type === id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label">Title</label>
              <span className={`text-xs ${titleLen > 280 ? 'text-red-400' : 'text-gray-400'}`}>
                {titleLen}/300
              </span>
            </div>
            <input
              {...register('title')}
              placeholder="An interesting, specific title"
              className={`input ${errors.title ? 'border-red-400' : ''}`}
              autoFocus
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> {errors.title.message}
              </p>
            )}
          </div>

          {/* Text content */}
          {type === 'text' && (
            <div>
              <label className="label">
                Content <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                {...register('content')}
                rows={8}
                placeholder="Write your post... Markdown is supported."
                className="input resize-y font-mono text-sm"
              />
            </div>
          )}

          {/* Link */}
          {type === 'link' && (
            <div>
              <label className="label">URL</label>
              <input
                {...register('url')}
                type="url"
                placeholder="https://example.com"
                className={`input ${errors.url ? 'border-red-400' : ''}`}
              />
              {errors.url && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.url.message}
                </p>
              )}
            </div>
          )}

          {/* Image upload */}
          {type === 'image' && (
            <div>
              <label className="label">Image</label>
              <ImageUpload
                value={uploadedImage}
                onChange={setUploadedImage}
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="label">
              Tags <span className="text-gray-400 font-normal">(up to 5)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span key={tag} className="badge badge-green flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                    className="hover:text-red-600 ml-0.5"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            {tags.length < 5 && (
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="technology, science, culture..."
                  className="input flex-1"
                />
                <button type="button" onClick={addTag} className="btn btn-outline btn-sm">
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Spoiler / NSFW toggles */}
          <div className="flex items-center gap-4 py-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600">
              <input type="checkbox" className="rounded accent-primary" /> Spoiler
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600">
              <input type="checkbox" className="rounded accent-primary" /> NSFW
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <button type="submit" disabled={isLoading} className="btn btn-primary gap-2">
              {isLoading
                ? <span className="flex items-center gap-2"><span className="spinner w-4 h-4" />Publishing...</span>
                : 'Publish Post'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-outline">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
