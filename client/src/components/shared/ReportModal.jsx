// components/shared/ReportModal.jsx — A reusable modal for reporting content
import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useSubmitReportMutation } from '../../services/moderationApi';
import toast from 'react-hot-toast';

const REASONS = [
  { id: 'spam', label: 'Spam' },
  { id: 'harassment', label: 'Harassment' },
  { id: 'hate_speech', label: 'Hate Speech' },
  { id: 'misinformation', label: 'Misinformation' },
  { id: 'violence', label: 'Violence' },
  { id: 'inappropriate_content', label: 'Inappropriate Content' },
  { id: 'other', label: 'Other' },
];

export default function ReportModal({ isOpen, onClose, targetId, targetModel }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitReport, { isLoading }] = useSubmitReportMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return toast.error('Please select a reason');
    
    try {
      await submitReport({
        targetId,
        targetModel,
        reason,
        description
      }).unwrap();
      toast.success('Report submitted. Thank you for keeping Inkwell safe.');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit report');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-dark-sidebar w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <AlertTriangle className="text-yellow-500" size={20} /> Report Content
            </h3>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg text-gray-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Reason</label>
              <div className="grid grid-cols-1 gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setReason(r.id)}
                    className={`text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${
                      reason === r.id 
                        ? 'border-primary bg-primary-50 text-primary font-bold' 
                        : 'border-gray-100 dark:border-dark-border hover:border-primary/30 text-gray-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Additional Details (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Help us understand the issue..."
                className="input min-h-[100px] py-3 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={onClose}
                className="btn btn-outline flex-1 justify-center h-11"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="btn btn-primary flex-1 justify-center h-11"
              >
                {isLoading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
