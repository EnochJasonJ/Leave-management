import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  Loader2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ApproveLeavesPage = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/leaves/all');
      setRequests(response.data);
    } catch (error) {
      toast.error('Failed to fetch leave requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.put(`/leaves/${id}/status`, { status });
      toast.success(`Request ${status.toLowerCase()} successfully`);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-500 text-sm mt-1">Review and manage leave requests from students and staff.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requests.length > 0 ? requests.map((req: any) => (
          <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                <User size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900">{req.user.name}</h4>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase rounded tracking-wider">
                    {req.user.role}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-1 mb-2">{req.reason}</p>
                <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>Applied: {new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
              {req.status === 'SUBMITTED' ? (
                <>
                  <button 
                    onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg text-sm font-bold transition-colors"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-bold shadow-sm transition-colors"
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>
                </>
              ) : (
                <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${
                  req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  {req.status}
                </span>
              )}
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Clock size={32} />
            </div>
            <h3 className="text-gray-900 font-bold">No Pending Requests</h3>
            <p className="text-gray-400 text-sm mt-1">When requests come in, they'll appear here for review.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApproveLeavesPage;
