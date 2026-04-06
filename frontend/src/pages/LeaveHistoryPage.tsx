import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Search, 
  Filter, 
  Download,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Loader2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const LeaveHistoryPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/leaves/history');
        setLeaves(response.data);
      } catch (error) {
        toast.error('Failed to fetch leave history');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'SUBMITTED': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'REJECTED': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle2 size={14} />;
      case 'SUBMITTED': return <Clock size={14} />;
      case 'REJECTED': return <XCircle size={14} />;
      default: return null;
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Leave History Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["ID", "Type", "Duration", "Applied On", "Status", "Reason"];
    const tableRows: any[] = [];

    leaves.forEach((leave: any) => {
      const leaveData = [
        `LR-${String(leave.id).padStart(4, '0')}`,
        leave.type,
        `${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}`,
        new Date(leave.createdAt).toLocaleDateString(),
        leave.status,
        leave.reason
      ];
      tableRows.push(leaveData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 }
    });

    doc.save(`Leave_History_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded successfully');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave History</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage all your previous leave requests.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            Download PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by ID, type or status..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Leave ID</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Applied On</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaves.length > 0 ? leaves.map((leave: any) => (
                <tr key={leave.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-blue-600">LR-{String(leave.id).padStart(4, '0')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gray-100 text-gray-500">
                        <FileText size={14} />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{leave.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="text-xs text-gray-400">
                      {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(leave.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(leave.status)}`}>
                      {getStatusIcon(leave.status)}
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No leave history found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {leaves.length} requests</span>
        </div>
      </div>
    </div>
  );
};

export default LeaveHistoryPage;
