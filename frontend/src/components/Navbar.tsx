import { useState, useEffect, useRef } from 'react';
import { Menu, Search, Bell, X, User as UserIcon, BookOpen, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface NavbarProps {
  onMenuClick: () => void;
  isSidebarOpen?: boolean;
}

const Navbar = ({ onMenuClick, isSidebarOpen }: NavbarProps) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const items: any[] = [];

      // Fetch recent leave activity
      try {
        const leavesRes = await api.get('/leaves/history');
        const leaves = Array.isArray(leavesRes.data) ? leavesRes.data.slice(0, 3) : [];
        leaves.forEach((l: any) => {
          items.push({
            id: `leave-${l.id}`,
            icon: l.status === 'APPROVED' ? 'approved' : l.status === 'REJECTED' ? 'rejected' : 'pending',
            title: `${l.type} Leave ${l.status === 'APPROVED' ? 'Approved' : l.status === 'REJECTED' ? 'Rejected' : 'Submitted'}`,
            description: `${new Date(l.startDate).toLocaleDateString()} - ${new Date(l.endDate).toLocaleDateString()}`,
            time: new Date(l.updatedAt || l.createdAt).toLocaleString(),
          });
        });
      } catch { /* no leaves for this role */ }

      // Fetch recent assignments
      try {
        const assignRes = await api.get('/assignments');
        const assigns = Array.isArray(assignRes.data) ? assignRes.data.slice(0, 3) : [];
        assigns.forEach((a: any) => {
          const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000);
          items.push({
            id: `assign-${a.id}`,
            icon: 'assignment',
            title: a.title,
            description: daysLeft > 0 ? `Due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}` : 'Overdue!',
            time: new Date(a.createdAt).toLocaleString(),
          });
        });
      } catch { /* no assignments for this role */ }

      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(items.slice(0, 6));
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'approved': return <CheckCircle2 size={18} className="text-emerald-500" />;
      case 'rejected': return <AlertCircle size={18} className="text-rose-500" />;
      case 'pending': return <Clock size={18} className="text-amber-500" />;
      case 'assignment': return <BookOpen size={18} className="text-blue-500" />;
      default: return <Clock size={18} className="text-gray-500" />;
    }
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4 lg:px-6 shadow-sm z-30 relative">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
        >
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className="relative max-w-md w-full hidden sm:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => { 
              setShowNotifications(!showNotifications); 
              if (!showNotifications) fetchNotifications(); 
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                ) : notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.id} className="p-4 hover:bg-gray-50/80 transition-colors cursor-pointer">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5 p-2 bg-gray-100 rounded-xl">
                          {getIcon(n.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.description}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="mx-auto text-gray-300 mb-2" size={28} />
                    <p className="text-sm text-gray-400">No notifications yet</p>
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-100 bg-gray-50/80">
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Guest User'}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase() || 'Visitor'}</p>
          </div>
          <button className="h-9 w-9 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition-colors">
            {user?.name?.charAt(0) || <UserIcon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
