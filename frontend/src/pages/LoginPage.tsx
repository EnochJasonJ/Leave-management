import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Calendar, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      login(user, token);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Invalid email or password. Use: enoch.jason@college.edu / password123');
      toast.error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 animate-in zoom-in-95 duration-700">
        {/* Left Side - Info */}
        <div className="md:w-1/2 bg-slate-900 p-12 text-white flex flex-col justify-center relative">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Calendar size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">LMS Portal</h1>
          </div>
          
          <h2 className="text-2xl font-bold mb-4 leading-tight">Welcome to the College Leave Management System</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Manage your leave requests, track academic assignments, and stay updated with campus alerts all in one place.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Secure Access</h4>
                <p className="text-xs text-slate-500">Institutional email access only</p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-12 border-t border-white/10 text-xs text-slate-500 text-center">
            &copy; 2026 St. Mary's Engineering College. All rights reserved.
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-12 bg-white flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h3 className="text-2xl font-bold text-gray-900">Sign In</h3>
            <p className="text-gray-500 mt-2">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium animate-in slide-in-from-top-2">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="enoch.jason@college.edu"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {isLoading ? 'Verifying Account...' : 'Sign In to Portal'}
            </button>

            <div className="text-center mt-8">
              <p className="text-sm text-gray-500">
                New user? <button type="button" className="font-bold text-blue-600 hover:text-blue-700">Check your email for invite</button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
