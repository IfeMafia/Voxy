"use client";

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Users, 
  Search, 
  Shield, 
  User, 
  Loader2,
  Mail,
  Filter,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function AdminCustomersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/customers');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load users');
      return json.customers;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Delete failed');
      return json;
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ id, newRole }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Status update failed');
      return json;
    },
    onSuccess: (_, variables) => {
      const action = variables.newRole === 'admin' ? 'promote' : 'demote';
      toast.success(`User ${action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    deleteMutation.mutate(id);
  };

  const handleToggleAdmin = (u) => {
    const newRole = u.role === 'admin' ? 'customer' : 'admin';
    const action = newRole === 'admin' ? 'Promote' : 'Demote';
    
    if (!confirm(`Confirm ${action} of user ${u.email}?`)) return;
    toggleAdminMutation.mutate({ id: u.id, newRole });
  };

  const filteredCustomers = customers.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const actionLoading = deleteMutation.isPending || toggleAdminMutation.isPending;

  if (isLoading) {
    return (
      <DashboardLayout title="Users">
        <div className="flex flex-col items-center justify-center p-20 min-h-[60vh] text-zinc-500 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-voxy-primary" />
          <p className="text-[13px] font-medium text-zinc-500">Loading user records...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Directory">
      <div className="max-w-[1400px] mx-auto pt-8 pb-32 space-y-10">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">User Directory</h1>
            <p className="text-[15px] text-zinc-500 font-medium">
              Manage platform users, roles, and administrative access.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-voxy-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="bg-[#0A0A0A] border border-white/5 text-white text-[13px] font-medium rounded-xl pl-11 pr-4 h-11 focus:outline-none focus:border-voxy-primary/40 focus:bg-[#0F0F0F] transition-all w-full md:w-72"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <button className="h-11 px-5 bg-[#0A0A0A] text-zinc-500 font-medium text-[13px] rounded-xl hover:text-white hover:border-white/20 transition-all border border-white/5 flex items-center gap-3">
                <Filter className="w-4 h-4" /> Filter
             </button>
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                  <th className="py-5 px-8 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">User</th>
                  <th className="py-5 px-6 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">Access Role</th>
                  <th className="py-5 px-6 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">Registration</th>
                  <th className="py-5 px-8 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-32 text-center text-zinc-600">
                      <div className="flex flex-col items-center">
                        <Users size={32} className="text-zinc-800 mb-4" />
                        <p className="text-[13px] font-medium text-zinc-600">No matching user records found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((u) => (
                    <tr key={u.id} className="group hover:bg-white/[0.01] transition-all">
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-4">
                          <div className={`size-12 rounded-xl border flex items-center justify-center transition-all ${u.role === 'admin' ? 'bg-voxy-primary/10 border-voxy-primary/20 text-voxy-primary' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                            {u.role === 'admin' ? <Shield size={20} /> : <User size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-voxy-primary transition-colors tracking-tight text-[15px]">{u.name || 'Unknown User'}</p>
                            <p className="text-[12px] font-medium text-zinc-500 lowercase mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <Badge variant="outline" className={`
                          text-[10px] font-medium px-3 py-0.5 border-0
                          ${u.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                            ['business', 'business_owner', 'owner'].includes(u.role) ? 'bg-blue-500/10 text-blue-500' :
                            'bg-zinc-500/10 text-zinc-500'}
                        `}>
                          {u.role || 'User'}
                        </Badge>
                      </td>
                      <td className="py-5 px-6">
                        <div>
                          <p className="text-[13px] font-medium text-white tabular-nums">{new Date(u.created_at).toLocaleDateString()}</p>
                          <p className="text-[11px] font-medium text-zinc-600 mt-0.5">Registration date</p>
                        </div>
                      </td>
                      <td className="py-5 px-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                             onClick={() => handleToggleAdmin(u)}
                             disabled={(toggleAdminMutation.isPending && toggleAdminMutation.variables?.id === u.id) || u.id === currentUser?.id}
                             title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                             className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-all ${
                               u.role === 'admin' 
                                 ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20" 
                                 : "bg-white/5 border-white/5 text-zinc-500 hover:text-voxy-primary hover:border-voxy-primary/30"
                             }`}
                          >
                             {(toggleAdminMutation.isPending && toggleAdminMutation.variables?.id === u.id) ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                          </button>
                          <button 
                             onClick={() => handleDelete(u.id)}
                             disabled={(deleteMutation.isPending && deleteMutation.variables === u.id) || u.id === currentUser?.id}
                             title="Delete User"
                             className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all disabled:opacity-50"
                          >
                             {(deleteMutation.isPending && deleteMutation.variables === u.id) ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-white/[0.03] flex items-center justify-between bg-white/[0.01]">
            <p className="text-[11px] font-medium text-zinc-500">Showing {filteredCustomers.length} user records</p>
            <div className="flex gap-2">
               <button className="h-9 px-4 rounded-lg bg-white/5 border border-white/5 text-zinc-600 text-[12px] font-semibold cursor-not-allowed">
                  Previous
               </button>
               <button className="h-9 px-4 rounded-lg bg-white/5 border border-white/5 text-zinc-600 text-[12px] font-semibold cursor-not-allowed">
                  Next
               </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

