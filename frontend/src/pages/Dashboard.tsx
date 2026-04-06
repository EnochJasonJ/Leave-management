import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Loader2,
  GraduationCap,
  BookOpen,
  Award
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRequests: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    breakdown: {
      casual: { total: 15, used: 0 },
      sick: { total: 10, used: 0 },
      special: { total: 5, used: 0 }
    },
    attendance: {
      totalWorkingDays: 120,
      daysPresent: 120,
      approvedLeaveDays: 0,
      attendancePercent: 100,
      attendanceMark: 5,
    },
    internals: {
      attendanceMark: 5,
      assignmentMark: 0,
      totalAssignments: 0,
      submittedAssignments: 0,
      internalMark: 5,
    }
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          api.get('/leaves/stats'),
          api.get('/leaves/history')
        ]);
        setStats(statsRes.data);
        setRecentLeaves(historyRes.data.slice(0, 5));
      } catch (error) {
        toast.error('Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { label: 'Total Requests', value: stats.totalRequests, icon: FileText, color: 'blue' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'emerald' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'amber' },
    { label: 'Rejected', value: stats.rejected, icon: AlertCircle, color: 'rose' },
  ];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  const totalLeaveDays = (stats.breakdown?.casual?.total || 15) + (stats.breakdown?.sick?.total || 10) + (stats.breakdown?.special?.total || 5);
  const usedLeaveDays = (stats.breakdown?.casual?.used || 0) + (stats.breakdown?.sick?.used || 0) + (stats.breakdown?.special?.used || 0);
  const remainingPercent = Math.round(((totalLeaveDays - usedLeaveDays) / totalLeaveDays) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          {user?.role !== 'PRINCIPAL' && (
            <Link to="/apply-leave" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20">
              Apply Leave
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-bold mt-1 text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Leave Requests</h3>
            <Link to="/leave-history" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Type</th>
                  <th className="pb-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Date</th>
                  <th className="pb-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentLeaves.length > 0 ? recentLeaves.map((leave: any) => (
                  <tr key={leave.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 font-medium text-gray-900">{leave.type}</td>
                    <td className="py-4 text-gray-500">{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 
                        leave.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-400">No recent requests found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Leave Balance</h3>
          <div className="space-y-6">
            {[
              { label: 'Casual Leave', total: stats.breakdown?.casual?.total || 15, used: stats.breakdown?.casual?.used || 0, color: 'blue' },
              { label: 'Sick Leave', total: stats.breakdown?.sick?.total || 10, used: stats.breakdown?.sick?.used || 0, color: 'emerald' },
              { label: 'Special Leave', total: stats.breakdown?.special?.total || 5, used: stats.breakdown?.special?.used || 0, color: 'indigo' },
            ].map((leave) => {
              const percent = (leave.used / leave.total) * 100;
              return (
                <div key={leave.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-gray-700">{leave.label}</span>
                    <span className="text-gray-500 font-medium">{leave.used} / {leave.total} days</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full bg-${leave.color}-500 transition-all duration-1000 ease-out`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3 text-blue-800 font-semibold mb-1">
              <TrendingUp size={18} />
              <span className="text-sm">Quick Insight</span>
            </div>
            <p className="text-xs text-blue-600 leading-relaxed">
              You have {Math.max(0, remainingPercent)}% of your total leave balance remaining for this academic year.
            </p>
          </div>
        </div>
      </div>

      {/* Attendance & Internal Marks Section — Students Only */}
      {user?.role === 'STUDENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Attendance Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                <GraduationCap size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Attendance</h3>
            </div>

            {/* Circular Gauge */}
            <div className="flex justify-center mb-6">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={stats.attendance.attendancePercent >= 85 ? '#10b981' : stats.attendance.attendancePercent >= 75 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(stats.attendance.attendancePercent / 100) * 314} 314`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-gray-900">{stats.attendance.attendancePercent}%</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Attendance</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-500">Working Days</span>
                <span className="font-bold text-gray-900">{stats.attendance.totalWorkingDays}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-500">Days Present</span>
                <span className="font-bold text-emerald-600">{stats.attendance.daysPresent}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-500">Leave Days</span>
                <span className="font-bold text-rose-500">{stats.attendance.approvedLeaveDays}</span>
              </div>
            </div>
          </div>

          {/* Internal Marks Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Award size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Internal Marks</h3>
              <span className="ml-auto text-2xl font-black text-gray-900">{stats.internals.internalMark}<span className="text-base text-gray-400 font-semibold"> / 20</span></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Attendance Mark */}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap size={18} className="text-violet-600" />
                  <span className="text-sm font-bold text-violet-900">Attendance Component</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-violet-700">{stats.internals.attendanceMark}</span>
                  <span className="text-lg text-violet-400 font-semibold mb-1">/ 5</span>
                </div>
                <div className="mt-3 w-full bg-violet-200 rounded-full h-2.5 overflow-hidden">
                  <div className="h-2.5 rounded-full bg-violet-600 transition-all duration-1000" style={{ width: `${(stats.internals.attendanceMark / 5) * 100}%` }}></div>
                </div>
                <p className="text-[11px] text-violet-500 mt-2">Based on {stats.attendance.attendancePercent}% attendance</p>
              </div>

              {/* Assignment Mark */}
              <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={18} className="text-blue-600" />
                  <span className="text-sm font-bold text-blue-900">Assignment Component</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-blue-700">{stats.internals.assignmentMark}</span>
                  <span className="text-lg text-blue-400 font-semibold mb-1">/ 15</span>
                </div>
                <div className="mt-3 w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                  <div className="h-2.5 rounded-full bg-blue-600 transition-all duration-1000" style={{ width: `${(stats.internals.assignmentMark / 15) * 100}%` }}></div>
                </div>
                <p className="text-[11px] text-blue-500 mt-2">{stats.internals.submittedAssignments} of {stats.internals.totalAssignments} assignments submitted</p>
              </div>
            </div>

            {/* Total Internal Mark Bar */}
            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-700">Total Internal Mark</span>
                <span className="text-sm font-bold text-gray-900">{stats.internals.internalMark} / 20</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${
                    stats.internals.internalMark >= 16 ? 'bg-emerald-500' : 
                    stats.internals.internalMark >= 10 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${(stats.internals.internalMark / 20) * 100}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                {stats.internals.internalMark >= 16 ? '🎉 Excellent performance! Keep it up.' : 
                 stats.internals.internalMark >= 10 ? '⚡ Good progress. Improve attendance or submit more assignments.' :
                 '⚠️ Needs improvement. Focus on attendance and assignment submissions.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
