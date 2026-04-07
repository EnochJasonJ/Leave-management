import { Mail, Phone, MapPin, Building, GraduationCap, Edit2, Shield, Loader2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', batch: '', rollNumber: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        setProfileData(response.data);
        setEditForm({
          name: response.data.name || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          batch: response.data.batch || '',
          rollNumber: response.data.rollNumber || ''
        });
      } catch (error) {
        toast.error('Failed to fetch profile details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    // ✅ FIXED: Add input validation
    if (!editForm.name || editForm.name.trim().length === 0) {
      toast.error('Name cannot be empty');
      return;
    }

    if (editForm.name.length > 255) {
      toast.error('Name must not exceed 255 characters');
      return;
    }

    if (editForm.phone && editForm.phone.length > 20) {
      toast.error('Phone number must not exceed 20 characters');
      return;
    }

    if (editForm.address && editForm.address.length > 500) {
      toast.error('Address must not exceed 500 characters');
      return;
    }

    if (editForm.batch && editForm.batch.length > 50) {
      toast.error('Batch must not exceed 50 characters');
      return;
    }

    if (editForm.rollNumber && editForm.rollNumber.length > 50) {
      toast.error('Roll number must not exceed 50 characters');
      return;
    }

    try {
      const response = await api.put('/auth/me', editForm);
      setProfileData(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  const user = {
    name: profileData?.name || authUser?.name || 'User',
    role: profileData?.role || authUser?.role || 'User',
    email: profileData?.email || authUser?.email || '',
    phone: profileData?.phone || 'Not Provided',
    department: profileData?.department?.name || 'General Academic',
    batch: profileData?.batch || 'Not Assigned',
    address: profileData?.address || 'Not Provided',
    rollNumber: profileData?.rollNumber || 'N/A',
    avatar: null
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        {isEditing ? (
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 text-gray-700 transition-colors">
              <X size={16} /> Cancel
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
              <Check size={16} /> Save Changes
            </button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm text-gray-700">
            <Edit2 size={16} />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="relative inline-block">
              <div className="h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-xl shadow-blue-600/20">
                {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </div>
              <div className="absolute right-0 bottom-0 bg-white p-1.5 rounded-full shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                <Edit2 size={14} className="text-blue-500" />
              </div>
            </div>
            
            {isEditing ? (
              <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="text-xl font-bold text-gray-900 border focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 outline-none text-center min-w-[200px]" />
            ) : (
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            )}
            
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest">{user.role}</p>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-3 text-gray-600 justify-center">
              <Shield size={16} className="text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider">Account Active</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap size={18} className="text-blue-500" />
              Academic Info
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Department</p>
                <p className="text-sm font-medium text-gray-800">{user.department}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Batch / Year</p>
                {isEditing ? (
                  <input type="text" value={editForm.batch} onChange={e => setEditForm({...editForm, batch: e.target.value})} className="w-full text-sm font-medium text-gray-800 border focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all" />
                ) : (
                  <p className="text-sm font-medium text-gray-800">{user.batch}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Roll Number</p>
                {isEditing ? (
                  <input type="text" value={editForm.rollNumber} onChange={e => setEditForm({...editForm, rollNumber: e.target.value})} className="w-full text-sm font-medium text-gray-800 border focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all" />
                ) : (
                  <p className="text-sm font-medium text-gray-800">{user.rollNumber}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Mail size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Email Address</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Phone size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Phone Number</span>
                </div>
                {isEditing ? (
                  <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full text-sm font-medium text-gray-900 border focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all" />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{user.phone}</p>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Building size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">College</span>
                </div>
                <p className="text-sm font-medium text-gray-900">St. Mary's Engineering College</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <MapPin size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Address</span>
                </div>
                {isEditing ? (
                  <input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full text-sm font-medium text-gray-900 border focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 outline-none transition-all" />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{user.address}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Security & Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Change Password</p>
                    <p className="text-xs text-gray-500">Update your account password regularly for better security.</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Notification Preferences</p>
                    <p className="text-xs text-gray-500">Manage how you receive leave and assignment alerts.</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ size, className }: { size: number, className: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default ProfilePage;
