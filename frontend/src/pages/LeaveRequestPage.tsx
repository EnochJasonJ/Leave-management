import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Send, Info, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const LeaveRequestPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/leaves', formData);
      toast.success('Leave request submitted successfully!');
      navigate('/leave-history');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Apply for Leave</h1>
        <p className="text-gray-500 text-sm mt-1">Please fill out the form below to submit your leave request.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">Leave Type</label>
              <div className="grid grid-cols-2 gap-4">
                {['Casual Leave', 'Sick Leave', 'Special Leave', 'Duty Leave'].map((type) => (
                  <label key={type} className={`
                    flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${formData.type === type 
                      ? 'border-blue-600 bg-blue-50 text-blue-700' 
                      : 'border-gray-100 hover:border-gray-200 text-gray-500'}
                  `}>
                    <input 
                      type="radio" 
                      name="leaveType" 
                      value={type}
                      className="hidden"
                      onChange={() => setFormData({...formData, type})}
                    />
                    <span className="text-sm font-medium">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="date" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="date" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Reason for Leave</label>
              <textarea 
                rows={4}
                placeholder="Briefly explain the reason for your leave request..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Attachments (Optional)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group">
                <div className="bg-gray-100 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                  <FileText className="text-gray-400 group-hover:text-blue-600" size={24} />
                </div>
                <p className="text-sm font-medium text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG (max 5MB)</p>
                <input type="file" className="hidden" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 text-gray-900 font-bold mb-4">
              <Info size={20} className="text-blue-600" />
              <h3>Leave Guidelines</h3>
            </div>
            <ul className="space-y-4">
              {[
                'Apply at least 2 days in advance for casual leave.',
                'Medical certificate required for sick leave exceeding 2 days.',
                'Ensure all assignments are submitted before leaving.',
                'Contact your HOD for urgent approval requests.'
              ].map((text, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="font-bold mb-2">Need Help?</h3>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              If you have any questions regarding the leave policy, please refer to the student handbook.
            </p>
            <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors">
              Read Handbook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestPage;
