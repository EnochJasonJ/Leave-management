import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, CheckCircle2, ChevronRight, Loader2, Plus, X, Upload, FileText, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const AssignmentPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '' });
  const [submitForm, setSubmitForm] = useState({ notes: '', fileUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await api.get('/assignments');
        setAssignments(response.data);
      } catch (error) {
        toast.error('Failed to fetch assignments');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/assignments', taskForm);
      toast.success('Assignment created successfully');
      setTaskForm({ title: '', description: '', dueDate: '' });
      setIsModalOpen(false);
      
      const response = await api.get('/assignments');
      setAssignments(response.data);
    } catch (error) {
      toast.error('Failed to create assignment');
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    
    setIsSubmitting(true);
    try {
      // Mocking file upload: if notes are present, we consider it a submission
      // In a real app, this would be a multipart/form-data upload
      await api.post(`/assignments/${selectedTask.id}/submit`, submitForm);
      toast.success('Assignment submitted successfully!');
      setIsSubmitModalOpen(false);
      setSubmitForm({ notes: '', fileUrl: '' });
      
      const response = await api.get('/assignments');
      setAssignments(response.data);
    } catch (error) {
      toast.error('Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStaff = user?.role !== 'STUDENT';

  const stats = isStaff ? {
    total: assignments.length,
    totalSubmissions: assignments.reduce((sum: number, a: any) => sum + (a.submissions?.length || 0), 0),
    avgSubmissions: assignments.length > 0 
      ? Math.round(assignments.reduce((sum: number, a: any) => sum + (a.submissions?.length || 0), 0) / assignments.length) 
      : 0
  } : {
    total: assignments.length,
    completed: assignments.filter((a: any) => a.submissions && a.submissions.length > 0).length,
    pending: assignments.length - assignments.filter((a: any) => a.submissions && a.submissions.length > 0).length
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your academic tasks and deadlines.</p>
        </div>
        {user?.role !== 'STUDENT' && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20">
            <Plus size={18} /> Add Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BookOpen size={20} />
            </div>
            <h3 className="font-bold text-gray-900">Task Statistics</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-500">{isStaff ? 'Tasks Created' : 'Total Assigned'}</span>
              <span className="font-bold text-gray-900">{stats.total}</span>
            </div>
            {isStaff ? (
              <>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">Total Submissions</span>
                  <span className="font-bold text-emerald-600">{(stats as any).totalSubmissions}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">Avg. per Task</span>
                  <span className="font-bold text-blue-600">{(stats as any).avgSubmissions}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">Completed</span>
                  <span className="font-bold text-emerald-600">{(stats as any).completed}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">Pending</span>
                  <span className="font-bold text-amber-600">{(stats as any).pending}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          {(() => {
            const upcomingTask = assignments.length > 0 
              ? [...assignments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] 
              : null;
            
            if (!upcomingTask) {
              return (
                <div className="text-gray-500 text-sm">No upcoming deadlines found. You're all caught up!</div>
              );
            }

            const daysLeft = Math.ceil((new Date(upcomingTask.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            
            return (
              <>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">{isStaff ? 'Nearest Deadline' : 'Upcoming Deadline'}</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    {isStaff 
                      ? <>Your "{upcomingTask.title}" task is due in <span className="font-bold text-rose-500">{daysLeft} days</span>. {upcomingTask.submissions?.length || 0} students have submitted so far.</>
                      : <>Your "{upcomingTask.title}" task is due in <span className="font-bold text-rose-500">{daysLeft} days</span>. Submit before {new Date(upcomingTask.dueDate).toLocaleDateString()} to avoid late marks.</>
                    }
                  </p>
                </div>
                {isStaff ? (
                  <div className="flex items-center gap-2 text-blue-700 font-bold bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                    <Users size={20} />
                    {upcomingTask.submissions?.length || 0} Submitted
                  </div>
                ) : upcomingTask.submissions?.length > 0 ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                    <CheckCircle2 size={20} />
                    Submitted
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setSelectedTask(upcomingTask);
                      setIsSubmitModalOpen(true);
                    }}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all"
                  >
                    Start Task
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Recent Assignments</h3>
        <div className="grid grid-cols-1 gap-4">
          {assignments.length > 0 ? assignments.map((task: any) => (
            <div 
              key={task.id} 
              onClick={() => {
                if (user?.role === 'STUDENT' && !task.submissions?.length) {
                  setSelectedTask(task);
                  setIsSubmitModalOpen(true);
                }
              }}
              className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-all group ${user?.role === 'STUDENT' && !task.submissions?.length ? 'hover:border-blue-200 cursor-pointer' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm ${!isStaff && task.submissions?.length ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                    {!isStaff && task.submissions?.length ? <CheckCircle2 size={24} /> : task.title[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <h4 className={`font-bold text-gray-900 ${!isStaff && !task.submissions?.length ? 'group-hover:text-blue-600' : ''} transition-colors`}>{task.title}</h4>
                       {!isStaff && task.submissions?.length > 0 && (
                         <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Completed</span>
                       )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 max-w-xl truncate">{task.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="hidden sm:flex items-center gap-2 text-gray-500">
                    <Calendar size={16} />
                    <span className="text-sm font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isStaff ? (
                      <div className="flex items-center gap-1.5 text-blue-700 font-bold text-sm bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        <Users size={16} />
                        {task.submissions?.length || 0} Submitted
                      </div>
                    ) : task.submissions?.length > 0 ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        <CheckCircle2 size={16} />
                        Done
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                        <Clock size={16} />
                        Pending
                      </div>
                    )}
                    {!isStaff && !task.submissions?.length && (
                      <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500 transition-colors ml-2" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-gray-400 bg-white border border-dashed rounded-2xl">
              No assignments found.
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Plus className="text-blue-600" />
                Assign New Task
              </h2>
              
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Task Title</label>
                  <input type="text" required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="e.g. Midterm Report" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea required value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24 text-sm" placeholder="Task requirements..." />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                  <input type="date" required value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">Create Task</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Submit Task Modal */}
      {isSubmitModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="bg-slate-900 p-6 text-white">
              <button 
                onClick={() => setIsSubmitModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Upload className="text-blue-400" />
                Submit Assignment
              </h2>
              <p className="text-slate-400 text-sm mt-1">{selectedTask.title}</p>
            </div>
            
            <div className="p-8">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6 flex gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                <div className="text-xs text-blue-800 leading-relaxed">
                  <strong>Instructions:</strong> Please upload your assignment in PDF or DOCX format. 
                  Ensure your roll number is mentioned on the first page. Maximum file size: 10MB.
                </div>
              </div>

              <form onSubmit={handleSubmitTask} className="space-y-6">
                <div className="relative border-2 border-dashed border-gray-200 rounded-3xl p-8 hover:border-blue-400 transition-colors group cursor-pointer bg-gray-50/50">
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setSubmitForm({...submitForm, fileUrl: e.target.files[0].name});
                        toast.success(`File selected: ${e.target.files[0].name}`);
                      }
                    }}
                  />
                  <div className="text-center">
                    <div className="p-4 bg-white rounded-2xl shadow-sm inline-block mb-4 group-hover:scale-110 transition-transform">
                      {submitForm.fileUrl ? <FileText className="text-emerald-500" size={32} /> : <Upload className="text-blue-500" size={32} />}
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {submitForm.fileUrl || 'Click or drag files to upload'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">PDF, DOCX, ZIP up to 10MB</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Submission Notes (Optional)</label>
                  <textarea 
                    value={submitForm.notes} 
                    onChange={e => setSubmitForm({...submitForm, notes: e.target.value})} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 h-28 text-sm outline-none transition-all" 
                    placeholder="Add any comments for the instructor..." 
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsSubmitModalOpen(false)} 
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !submitForm.fileUrl}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Now'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentPage;
