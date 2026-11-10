import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  Award,
  CheckCircle,
  XCircle,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import { User, UserRole } from '../types/index.ts';

interface TeamViewProps {
  users: User[];
  currentUser: User;
  onUserCreated: (newUser: any) => Promise<void>;
}

export const TeamView: React.FC<TeamViewProps> = ({
  users,
  currentUser,
  onUserCreated,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('CORRETOR');
  const [phone, setPhone] = useState('');
  const [creci, setCreci] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);
    try {
      await onUserCreated({
        name,
        email,
        role,
        phone,
        creci,
        currentUserId: currentUser.id,
        currentUserName: currentUser.name,
      });
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPhone('');
      setCreci('');
    } catch (err) {
      alert('Erro ao criar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'GESTOR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CORRETOR':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Gestão de Equipe & Corretores Connect
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Perfis de Administrador, Gestor e Corretor para distribuição e acompanhamento de captações
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Usuário</span>
          </button>
        )}
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {users.map(u => (
          <div
            key={u.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition"
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/40"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-slate-900 truncate">{u.name}</h3>
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border mt-0.5 ${getRoleBadge(
                      u.role
                    )}`}
                  >
                    {u.role}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{u.email}</span>
                </div>
                {u.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{u.phone}</span>
                  </div>
                )}
                {u.creci && (
                  <div className="flex items-center space-x-2">
                    <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>CRECI {u.creci}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Leads Count Stat */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500">Captações Atribuídas:</span>
              <strong className="text-slate-900 font-extrabold text-sm">{u.assignedLeadsCount || 0}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm">Cadastrar Novo Membro da Equipe</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Lucas Medeiros"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="lucas@connectimoveis.com.br"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Perfil de Acesso</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                  >
                    <option value="CORRETOR">Corretor</option>
                    <option value="GESTOR">Gestor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">CRECI</label>
                  <input
                    type="text"
                    value={creci}
                    onChange={e => setCreci(e.target.value)}
                    placeholder="52390-F"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Telefone WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(47) 99888-7777"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
