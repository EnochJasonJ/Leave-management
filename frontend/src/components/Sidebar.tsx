import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FilePlus, 
  History, 
  BookOpen, 
  User, 
  LogOut,
  Calendar,
  Settings,
  ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ...(user?.role !== 'PRINCIPAL' ? [
      { icon: FilePlus, label: 'Apply Leave', path: '/apply-leave' },
      { icon: History, label: 'Leave History', path: '/leave-history' },
    ] : []),
    ...(user?.role !== 'STUDENT' ? [
      { icon: ClipboardCheck, label: 'Approve Leaves', path: '/approve-leaves' },
    ] : []),
    { icon: BookOpen, label: user?.role === 'STUDENT' ? 'Assignments' : 'Manage Assignments', path: '/assignments' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col shadow-xl transform transition-all duration-300 md:relative ${isOpen ? 'translate-x-0 md:ml-0' : '-translate-x-full md:-ml-64'}`}>
      <div className="p-6 flex items-center gap-3">
        <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Calendar size={24} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">LMS Portal</span>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:text-white'} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <Link to="/profile" onClick={() => setIsOpen(false)} className="block bg-slate-800/50 hover:bg-slate-800 rounded-2xl p-4 mb-6 transition-colors group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Settings size={16} className="text-blue-400 group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Quick Settings</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">Manage your system preferences and account settings.</p>
        </Link>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all duration-200 group w-full text-left"
        >
          <LogOut size={20} className="group-hover:text-red-500" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
