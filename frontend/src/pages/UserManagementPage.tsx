import { useState, useEffect } from 'react';
import  api  from '../services/api';
import { useAuth } from '../context/AuthContext';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  department?: {
    id: number;
    name: string;
  };
  isActive: boolean;
  phone?: string;
  batch?: string;
  rollNumber?: string;
  createdAt: string;
}

interface Department {
  id: number;
  name: string;
}

const UserManagementPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'STUDENT',
    departmentId: '',
    phone: '',
    batch: '',
    rollNumber: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load departments
      const deptResponse = await api.get('/users/departments');
      setDepartments(deptResponse.data);

      // Load users based on role
      let usersResponse;
      if (user?.role === 'PRINCIPAL') {
        usersResponse = await api.get('/users');
      } else if (user?.role === 'HOD') {
        usersResponse = await api.get(`/users/department/${user.departmentId}`);
      }
      setUsers(usersResponse?.data || []);
    } catch (err) {
      setError('Failed to load data');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'STUDENT',
      departmentId: user?.role === 'HOD' ? user.departmentId?.toString() || '' : '',
      phone: '',
      batch: '',
      rollNumber: '',
      password: ''
    });
    setEditingUser(null);
    setShowAddForm(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const submitData = {
        ...formData,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined
      };

      if (editingUser) {
        // Update user
        const { password, ...updateData } = submitData; // Don't send password on update
        await api.put(`/users/${editingUser.id}`, updateData);
        setSuccess('User updated successfully');
      } else {
        // Add new user
        await api.post('/users', submitData);
        setSuccess('User added successfully');
      }

      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.department?.id?.toString() || '',
      phone: user.phone || '',
      batch: user.batch || '',
      rollNumber: user.rollNumber || '',
      password: '' // Don't populate password
    });
    setEditingUser(user);
    setShowAddForm(true);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${userId}`);
      setSuccess('User deleted successfully');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const canAddUsers = user?.role === 'PRINCIPAL' || user?.role === 'HOD';
  const canEditUsers = user?.role === 'PRINCIPAL' ||
    (user?.role === 'HOD' && (editingUser?.role === 'STUDENT'));
  const canDeleteUsers = user?.role === 'PRINCIPAL';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">
          {user?.role === 'PRINCIPAL' ? 'Manage all users in the system' :
           user?.role === 'HOD' ? 'Manage students in your department' :
           'View user information'}
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Users</h2>
            {canAddUsers && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add User
              </button>
            )}
          </div>
        </div>

        {showAddForm && (
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={!!editingUser} // Can't change email when editing
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={user?.role === 'HOD'} // HODs can only create students
                  >
                    <option value="STUDENT">Student</option>
                    {user?.role === 'PRINCIPAL' && (
                      <>
                        <option value="HOD">HOD</option>
                        <option value="STAFF">Staff</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={user?.role === 'HOD'} // HODs can only assign to their department
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Batch</label>
                  <input
                    type="text"
                    value={formData.batch}
                    onChange={(e) => setFormData({...formData, batch: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Roll Number</label>
                  <input
                    type="text"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'PRINCIPAL' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'HOD' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'STAFF' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                    {user.department && (
                      <span className="ml-2">{user.department.name}</span>
                    )}
                    {user.batch && <span className="ml-2">Batch: {user.batch}</span>}
                    {user.rollNumber && <span className="ml-2">Roll: {user.rollNumber}</span>}
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {canEditUsers && (
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Edit
                    </button>
                  )}
                  {canDeleteUsers && user.id !== user.id && ( // Prevent self-deletion
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {users.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;