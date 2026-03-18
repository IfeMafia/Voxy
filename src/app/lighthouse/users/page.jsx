"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Users, 
  Search, 
  MoreVertical, 
  Calendar, 
  Shield, 
  User, 
  Building2, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Lock,
  Mail,
  Filter,
  Eye,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast'; // Assuming toast is from react-hot-toast

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (data.success) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load user records');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.id !== id));
        toast.success('User deleted successfully');
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch (error) {
      toast.error('Internal server error during delete');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAdmin = async (u) => {
    const newRole = u.role === 'admin' ? 'customer' : 'admin';
    const action = newRole === 'admin' ? 'Promote' : 'Demote';
    
    if (!confirm(`Confirm ${action} of user ${u.email}?`)) return;

    setActionLoading(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(user => user.id === u.id ? { ...user, role: newRole } : user));
        toast.success(`User ${action}d successfully`);
      } else {
        toast.error(data.error || 'Status update failed');
      }
    } catch (error) {
      toast.error('Internal server error during update');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = true; // BYPASS FOR TESTING

  if (!isAdmin && !loading) {
    // This will usually be caught by middleware, but good as a double check
    return (
      <DashboardLayout title="Access Denied">
        <div className="flex flex-col items-center justify-center p-20 bg-zinc-950 rounded-3xl border border-white/5 shadow-2xl">
          <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Unauthorized Access</h2>
          <p className="text-zinc-500 max-w-sm text-center font-bold text-sm uppercase tracking-wider">
            This module is reserved for platform administrators only.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout title="User Management">
        <div className="flex flex-col items-center justify-center p-20 min-h-[60vh] text-zinc-500 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#00D18F]" />
          <p className="font-black uppercase tracking-[0.2em] text-[10px]">Loading User Directory...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-10 pb-10">
        {/* Header Header */}
        <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 bg-[#00D18F]/10 text-[#00D18F] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#00D18F]/20">
                Platform Users
              </span>
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest ml-1">{filteredUsers.length} Total Users</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">User Directory</h1>
          </div>
          
          <div className="flex gap-3">
             <div className="relative group min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                <input 
                  type="text" 
                  placeholder="SEARCH USERS..." 
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-[#00D18F]/50 transition-all placeholder:text-zinc-700"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <button className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-white/50 hover:text-white transition-all">
                <Filter className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-[#050505] border border-white/5 rounded-[40px] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-900/50">
                  <th className="py-6 px-8 text-zinc-500 text-[10px] font-black uppercase tracking-widest">Name / Email</th>
                  <th className="py-6 px-8 text-zinc-500 text-[10px] font-black uppercase tracking-widest">Role</th>
                  <th className="py-6 px-8 text-zinc-500 text-[10px] font-black uppercase tracking-widest">Business</th>
                  <th className="py-6 px-8 text-zinc-500 text-[10px] font-black uppercase tracking-widest">Joined Date</th>
                  <th className="py-6 px-8 text-zinc-500 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-32 text-center">
                      <div className="flex flex-col items-center">
                        <User className="size-12 text-zinc-800 mb-4" />
                        <span className="text-zinc-600 font-black uppercase tracking-widest text-xs">No matching user records found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-8 px-8">
                        <div className="flex items-center gap-5">
                          <div className="size-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:bg-[#00D18F]/10 group-hover:border-[#00D18F]/30 transition-all relative">
                            {u.role === 'admin' ? (
                               <Shield className="w-6 h-6 text-[#00D18F]" />
                            ) : (
                               <User className="w-6 h-6 text-zinc-500 group-hover:text-white" />
                            )}
                            <div className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-[#050505] ${u.role === 'admin' ? 'bg-[#00D18F]' : 'bg-blue-500'}`}></div>
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-white group-hover:text-[#00D18F] transition-colors text-base truncate">{u.name || 'Anonymous Object'}</div>
                            <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold mt-1">
                               <Mail className="w-3 h-3" />
                               {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-8 px-8">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          u.role === 'admin' 
                            ? "bg-red-500/10 text-red-500 border-red-500/20" 
                            : u.role === 'business' || u.role === 'business_owner'
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        }`}>
                          {u.role === 'admin' && <Lock className="w-2.5 h-2.5" />}
                          {u.role || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-8 px-8">
                        {u.business_name ? (
                          <div className="flex items-center gap-2 text-white/80 font-bold group-hover:text-[#00D18F] transition-colors">
                            <Building2 className="w-4 h-4 text-[#00D18F]" />
                            <span className="text-sm truncate max-w-[150px]">{u.business_name}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 font-bold text-xs uppercase tracking-tighter">No Business</span>
                        )}
                      </td>
                      <td className="py-8 px-8">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-zinc-300">{new Date(u.created_at).toLocaleDateString()}</span>
                           <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">Joined</span>
                        </div>
                      </td>
                      <td className="py-8 px-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => handleToggleAdmin(u)}
                             disabled={actionLoading === u.id || u.id === currentUser?.id}
                             title={u.role === 'admin' ? "Demote to User" : "Promote to Admin"}
                             className={`p-2.5 rounded-xl border transition-all ${
                               u.role === 'admin' 
                                 ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20" 
                                 : "bg-zinc-900 border-white/5 text-zinc-500 hover:text-[#00D18F] hover:border-[#00D18F]/30"
                             } ${actionLoading === u.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                           >
                              {actionLoading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                           </button>
                           <button 
                             onClick={() => handleDelete(u.id)}
                             disabled={actionLoading === u.id || u.id === currentUser?.id}
                             className={`p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all ${
                               actionLoading === u.id ? 'opacity-50 cursor-not-allowed' : ''
                             }`}
                           >
                              {actionLoading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Placeholder */}
          <div className="p-8 bg-zinc-900/40 border-t border-white/5 flex items-center justify-between">
             <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Showing 1 to {filteredUsers.length} of {filteredUsers.length} users
             </div>
             <div className="flex gap-2">
                <button className="px-5 py-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-500 text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                   Previous
                </button>
                <button className="px-5 py-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-500 text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                   Next
                </button>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
