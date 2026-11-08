import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import {
  ShieldCheck,
  User as UserIcon,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Store,
  Clock,
  Sparkles,
} from 'lucide-react';

// Refined Apple-style vibrant gradients for profile cards
const AVATAR_PALETTES = [
  { id: 'blue', bg: 'from-[#0071E3] to-[#0051A8]', label: 'Azul Pro' },
  { id: 'purple', bg: 'from-[#5856D6] to-[#3634A3]', label: 'Índigo' },
  { id: 'emerald', bg: 'from-[#34C759] to-[#248A3D]', label: 'Verde' },
  { id: 'coral', bg: 'from-[#FF2D55] to-[#D70015]', label: 'Coral' },
  { id: 'amber', bg: 'from-[#FF9500] to-[#C97200]', label: 'Ámbar' },
  { id: 'teal', bg: 'from-[#30B0C7] to-[#008299]', label: 'Cian' },
];

export const ProfileLoginView: React.FC = () => {
  const { business, users, loginAsUser, addUser, updateUser, deleteUser } = useApp();

  const [isManagingProfiles, setIsManagingProfiles] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Form states for creating/editing
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('employee');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');

  const openCreateModal = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('employee');
    setFormAvatarUrl('');
    setIsCreatingUser(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email || '');
    setFormRole(user.role);
    setFormAvatarUrl(user.avatarUrl || '');
    setIsCreatingUser(false);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (isCreatingUser) {
      addUser({
        businessId: business.id,
        name: formName.trim(),
        email:
          formEmail.trim() ||
          `${formName.toLowerCase().replace(/\s+/g, '')}@${business.email.split('@')[1] || 'cafeboquete.pa'}`,
        role: formRole,
        avatarUrl: formAvatarUrl.trim() || undefined,
      });
      setIsCreatingUser(false);
    } else if (editingUser) {
      updateUser(editingUser.id, {
        name: formName.trim(),
        email: formEmail.trim() || editingUser.email,
        role: formRole,
        avatarUrl: formAvatarUrl.trim() || editingUser.avatarUrl,
      });
      setEditingUser(null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este perfil?')) {
      deleteUser(userId);
      setEditingUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#1D1D1F] flex flex-col justify-between selection:bg-[#0071E3] selection:text-white font-sans antialiased">
      {/* Top Header Bar */}
      <header className="px-6 sm:px-12 py-5 flex items-center justify-between border-b border-[#E5E5EA]/70 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-[#1D1D1F] text-base">SmartPyme</span>
              <span className="text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full bg-[#E5E5EA]/70 text-[#707070] font-semibold border border-[#D6D6D6]/60">
                Punto de Venta
              </span>
            </div>
            <p className="text-xs text-[#707070]">{business.name}</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs text-[#707070]">
          <div className="flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-[#86868B]" />
            <span>Panamá (B/. · USD)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#86868B]" />
            <span>{new Date().toLocaleDateString('es-PA', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
          </div>
        </div>
      </header>

      {/* Central Profile Picker Container (Netflix structure + Apple Clean Light Aesthetic) */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12 max-w-4xl mx-auto w-full">
        {/* Main Title */}
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F] mb-2.5">
            ¿Quién está operando hoy?
          </h1>
          <p className="text-sm text-[#707070] max-w-md mx-auto">
            {isManagingProfiles
              ? 'Toca un perfil para editar su nombre, rol de acceso o eliminarlo.'
              : 'Selecciona tu usuario para ingresar al turno de caja y administración.'}
          </p>
        </div>

        {/* Profiles Grid */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 max-w-3xl">
          {users.map((u, idx) => {
            const palette = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];

            return (
              <div
                key={u.id}
                className="group flex flex-col items-center cursor-pointer relative transition-transform duration-200"
                onClick={() => {
                  if (isManagingProfiles) {
                    openEditModal(u);
                  } else {
                    loginAsUser(u.id);
                  }
                }}
              >
                {/* Profile Box Card */}
                <div
                  className={`w-32 h-32 sm:w-36 sm:h-36 rounded-3xl relative overflow-hidden bg-gradient-to-br ${palette.bg} border-2 border-transparent transition-all duration-200 shadow-sm ${
                    isManagingProfiles
                      ? 'ring-2 ring-[#0071E3] ring-offset-2 ring-offset-[#FAFAFC]'
                      : 'group-hover:scale-105 group-hover:shadow-lg group-hover:ring-2 group-hover:ring-[#0071E3] group-hover:ring-offset-2 group-hover:ring-offset-[#FAFAFC] group-active:scale-95'
                  }`}
                >
                  {/* Avatar image or Monogram */}
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl font-bold text-white drop-shadow-sm select-none">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Manage mode overlay with pencil icon */}
                  {isManagingProfiles && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-white text-[#1D1D1F] shadow-md flex items-center justify-center">
                        <Pencil className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  {/* Active hover overlay */}
                  {!isManagingProfiles && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                  )}
                </div>

                {/* Name & Role */}
                <div className="mt-3 text-center max-w-[140px]">
                  <p className="text-sm font-semibold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors truncate">
                    {u.name}
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-medium text-[#707070]">
                    {u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] font-semibold text-[10px]">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Admin</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E5E5EA] text-[#707070] font-medium text-[10px]">
                        <UserIcon className="w-3 h-3" />
                        <span>Empleado</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* "+ Agregar perfil" Tile (Clean Apple style) */}
          <div
            onClick={openCreateModal}
            className="group flex flex-col items-center cursor-pointer transition-transform duration-200"
          >
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl border-2 border-dashed border-[#D6D6D6] group-hover:border-[#0071E3] bg-white group-hover:bg-[#0071E3]/5 flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-active:scale-95 shadow-xs">
              <div className="w-11 h-11 rounded-full bg-[#F5F5F7] group-hover:bg-[#0071E3]/10 flex items-center justify-center text-[#707070] group-hover:text-[#0071E3] transition-all">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-[#707070] group-hover:text-[#0071E3] transition-colors">
                Agregar perfil
              </p>
              <p className="mt-1 text-[11px] text-[#86868B]">Nuevo usuario</p>
            </div>
          </div>
        </div>

        {/* Action Button: "Administrar perfiles" / "Listo" */}
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => setIsManagingProfiles(!isManagingProfiles)}
            className={`px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 ${
              isManagingProfiles
                ? 'bg-[#1D1D1F] text-white hover:bg-black shadow-xs'
                : 'border border-[#D6D6D6] bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] shadow-xs'
            }`}
          >
            {isManagingProfiles ? 'Listo' : 'Administrar perfiles'}
          </button>

          {/* Quick login fallback */}
          {!isManagingProfiles && users.length > 0 && (
            <button
              type="button"
              onClick={() => loginAsUser(users[0].id)}
              className="px-5 py-2.5 rounded-full text-xs font-medium text-[#707070] hover:text-[#1D1D1F] hover:bg-white transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>Entrar como {users[0].name.split(' ')[0]}</span>
            </button>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="px-6 sm:px-12 py-4 border-t border-[#E5E5EA]/70 flex items-center justify-between text-xs text-[#86868B] bg-white">
        <p>SmartPyme · Terminal de ventas y gestión empresarial</p>
        <p className="hidden sm:inline">Modo seguro · Registro de auditoría por cajero y administrador</p>
      </footer>

      {/* Modal: Crear o Editar Perfil (Light Apple Theme) */}
      {(isCreatingUser || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#D6D6D6] rounded-3xl max-w-md w-full p-6 sm:p-8 text-[#1D1D1F] shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5EA]">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
                  {isCreatingUser ? 'Crear nuevo perfil' : 'Editar perfil de usuario'}
                </h3>
                <p className="text-xs text-[#707070] mt-0.5">
                  {isCreatingUser
                    ? 'Agrega un miembro al equipo para operar el sistema'
                    : 'Modifica el nombre o permisos del usuario'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreatingUser(false);
                  setEditingUser(null);
                }}
                className="p-1.5 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] block mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sofía Castillo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#F5F5F7] text-xs text-[#1D1D1F] px-3.5 py-2.5 rounded-2xl border border-[#D6D6D6]/80 focus:outline-hidden focus:border-[#0071E3] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] block mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  placeholder="sofia@cafeboquete.pa"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-[#F5F5F7] text-xs text-[#1D1D1F] px-3.5 py-2.5 rounded-2xl border border-[#D6D6D6]/80 focus:outline-hidden focus:border-[#0071E3] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] block mb-1.5">
                  Rol y Permisos
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormRole('employee')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      formRole === 'employee'
                        ? 'border-[#0071E3] bg-[#0071E3]/10 text-[#1D1D1F]'
                        : 'border-[#E5E5EA] bg-[#FAFAFC] text-[#707070] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#1D1D1F]">Empleado</span>
                      {formRole === 'employee' && <Check className="w-3.5 h-3.5 text-[#0071E3]" />}
                    </div>
                    <p className="text-[10px] text-[#707070] mt-0.5">Cobro de ventas y registro de mermas</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('admin')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      formRole === 'admin'
                        ? 'border-[#0071E3] bg-[#0071E3]/10 text-[#1D1D1F]'
                        : 'border-[#E5E5EA] bg-[#FAFAFC] text-[#707070] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#1D1D1F]">Administrador</span>
                      {formRole === 'admin' && <Check className="w-3.5 h-3.5 text-[#0071E3]" />}
                    </div>
                    <p className="text-[10px] text-[#707070] mt-0.5">Control de costos, anulación y ajustes</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] block mb-1">
                  URL de foto o avatar (opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formAvatarUrl}
                  onChange={(e) => setFormAvatarUrl(e.target.value)}
                  className="w-full bg-[#F5F5F7] text-xs text-[#1D1D1F] px-3.5 py-2.5 rounded-2xl border border-[#D6D6D6]/80 focus:outline-hidden focus:border-[#0071E3] transition-colors"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E5E5EA]">
                {!isCreatingUser && editingUser && users.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(editingUser.id)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingUser(false);
                      setEditingUser(null);
                    }}
                    className="px-4 py-2.5 rounded-2xl text-xs font-medium text-[#707070] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    {isCreatingUser ? 'Crear perfil' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
