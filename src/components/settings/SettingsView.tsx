import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, User as UserType } from '../../types';
import {
  Store,
  Users,
  ShieldCheck,
  UserCheck,
  Globe,
  RotateCcw,
  Check,
  Info,
  Plus,
  Trash2,
  X,
  Edit2,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    business,
    updateBusiness,
    users,
    currentUser,
    switchUser,
    updateUser,
    addUser,
    deleteUser,
    logoutSession,
    resetToDemoData,
    addToast,
  } = useApp();

  // Business profile form state
  const [bizName, setBizName] = useState(business.name);
  const [bizType, setBizType] = useState(business.type);
  const [bizAddress, setBizAddress] = useState(business.address);
  const [bizPhone, setBizPhone] = useState(business.phone);
  const [bizEmail, setBizEmail] = useState(business.email);
  const [bizRuc, setBizRuc] = useState(business.ruc || '');
  const [bizDv, setBizDv] = useState(business.dv || '');

  // User modal state (Creation & Editing)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('employee');
  const [userError, setUserError] = useState('');

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusiness({
      name: bizName,
      type: bizType,
      address: bizAddress,
      phone: bizPhone,
      email: bizEmail,
      ruc: bizRuc,
      dv: bizDv,
    });
  };

  const handleToggleRole = (userId: string, currentRole: UserRole) => {
    const newRole: UserRole = currentRole === 'admin' ? 'employee' : 'admin';
    updateUser(userId, { role: newRole });
  };

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('employee');
    setUserError('');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: UserType) => {
    setEditingUser(u);
    setNewUserName(u.name);
    setNewUserEmail(u.email);
    setNewUserRole(u.role);
    setUserError('');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      setUserError('El nombre completo es requerido');
      return;
    }
    if (!newUserEmail.trim()) {
      setUserError('El correo electrónico es requerido');
      return;
    }

    // Check duplicate email (excluding self if editing)
    const duplicate = users.find(
      (u) => u.id !== editingUser?.id && u.email.toLowerCase() === newUserEmail.trim().toLowerCase()
    );
    if (duplicate) {
      setUserError(`Ya existe un usuario registrado con el correo ${newUserEmail}`);
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        role: newUserRole,
      });
    } else {
      addUser({
        businessId: business.id,
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        role: newUserRole,
      });
    }

    setIsUserModalOpen(false);
    setEditingUser(null);
    setNewUserName('');
    setNewUserEmail('');
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el usuario "${name}"? Esta acción no se puede deshacer.`)) {
      deleteUser(userId);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* 1. Business Profile Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5EA]/70 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E5E5EA]">
          <div className="p-2.5 rounded-2xl bg-[#0071E3]/10 text-[#0071E3]">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1D1D1F]">Perfil del Negocio</h3>
            <p className="text-xs text-[#707070]">Información comercial y datos de contacto de la sucursal</p>
          </div>
        </div>

        <form onSubmit={handleSaveBusiness} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                Nombre Comercial del Negocio
              </label>
              <input
                type="text"
                required
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="w-full bg-[#F5F5F7] text-xs font-medium p-3 rounded-2xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                Giro / Tipo de Negocio
              </label>
              <input
                type="text"
                required
                value={bizType}
                onChange={(e) => setBizType(e.target.value)}
                className="w-full bg-[#F5F5F7] text-xs font-medium p-3 rounded-2xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
              Dirección Física en Panamá
            </label>
            <input
              type="text"
              value={bizAddress}
              onChange={(e) => setBizAddress(e.target.value)}
              className="w-full bg-[#F5F5F7] text-xs font-medium p-3 rounded-2xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Teléfono</label>
              <input
                type="text"
                value={bizPhone}
                onChange={(e) => setBizPhone(e.target.value)}
                className="w-full bg-[#F5F5F7] text-xs font-medium p-3 rounded-2xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={bizEmail}
                onChange={(e) => setBizEmail(e.target.value)}
                className="w-full bg-[#F5F5F7] text-xs font-medium p-3 rounded-2xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">R.U.C. Registrado</label>
              <input
                type="text"
                value={bizRuc}
                onChange={(e) => setBizRuc(e.target.value)}
                placeholder="1556892-1-845230"
                className="w-full bg-[#F5F5F7] text-xs font-medium p-3 rounded-2xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">D.V.</label>
              <input
                type="text"
                value={bizDv}
                onChange={(e) => setBizDv(e.target.value)}
                placeholder="42"
                className="w-full bg-[#F5F5F7] text-xs font-medium p-3 rounded-2xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-2xl shadow-xs transition-colors"
            >
              Guardar Perfil del Negocio
            </button>
          </div>
        </form>
      </section>

      {/* 2. User Accounts and Role Permissions */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5EA]/70 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5EA] gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#34C759]/10 text-[#34C759]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1D1D1F]">Usuarios y Roles de Acceso</h3>
              <p className="text-xs text-[#707070]">
                Edita nombres, roles, crea nuevos empleados o elimina usuarios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={logoutSession}
              className="px-3.5 py-1.5 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] border border-[#D6D6D6]/80 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
              title="Ir a la pantalla de selección de perfiles estilo Netflix"
            >
              <Users className="w-3.5 h-3.5 text-[#0071E3]" />
              <span className="hidden sm:inline">Pantalla de inicio</span>
              <span className="sm:hidden">Perfiles</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateUser}
              className="px-3.5 py-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo usuario</span>
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {users.map((u) => {
            const isCurrent = u.id === currentUser.id;
            return (
              <div
                key={u.id}
                className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E5E5EA] flex items-center justify-center font-medium text-xs text-[#1D1D1F]">
                    {u.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-xs text-[#1D1D1F]">{u.name}</p>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold text-[#0071E3] bg-[#0071E3]/10 px-2 py-0.5 rounded-full">
                          Sesión activa
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#707070]">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 ${
                      u.role === 'admin'
                        ? 'bg-[#0071E3]/10 text-[#0071E3]'
                        : 'bg-[#34C759]/10 text-[#34C759]'
                    }`}
                  >
                    {u.role === 'admin' ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Administrador</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Empleado</span>
                      </>
                    )}
                  </span>

                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => switchUser(u.id)}
                      className="px-2.5 py-1 bg-white hover:bg-[#F5F5F7] border border-[#D6D6D6] text-xs font-medium rounded-xl text-[#1D1D1F] transition-colors"
                    >
                      Activar
                    </button>
                  )}

                  {/* Edit User Button (Available for EVERY user, including Carlos Mendoza) */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditUser(u)}
                    className="px-2.5 py-1 bg-white hover:bg-[#F5F5F7] border border-[#D6D6D6] text-xs font-medium rounded-xl text-[#0071E3] flex items-center gap-1 transition-colors"
                    title="Editar nombre, correo y rol"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>

                  {/* Toggle Role Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleRole(u.id, u.role)}
                    className="px-2.5 py-1 bg-white hover:bg-[#F5F5F7] border border-[#D6D6D6] text-xs font-medium rounded-xl text-[#707070] transition-colors"
                  >
                    Hacer {u.role === 'admin' ? 'Empleado' : 'Admin'}
                  </button>

                  {/* Delete User Button (Available for all users if users.length > 1) */}
                  {users.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="p-1.5 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-xl transition-colors"
                      title={isCurrent ? "Eliminar este usuario (la sesión pasará a otro usuario)" : "Eliminar usuario"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-4 rounded-2xl bg-[#F5F5F7] text-xs space-y-1 text-[#707070]">
          <p className="font-semibold text-[#1D1D1F]">Control de Permisos por Rol:</p>
          <p>• <strong>Administrador:</strong> Acceso completo, edición de recetas, costos de insumos, auditoría y cancelación de ventas.</p>
          <p>• <strong>Empleado:</strong> Registro de ventas, consulta de stock y movimientos operativos autorizados.</p>
        </div>
      </section>

      {/* 3. Regional & Fiscal Settings */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5EA]/70 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E5E5EA]">
          <div className="p-2.5 rounded-2xl bg-[#FF9500]/10 text-[#FF9500]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1D1D1F]">Parámetros Regionales y Fiscales</h3>
            <p className="text-xs text-[#707070]">Moneda, huso horario y normativa comercial para Panamá</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 text-xs">
          <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#E5E5EA]">
            <span className="text-[#707070] block">Moneda de Operación:</span>
            <span className="font-semibold text-sm text-[#1D1D1F] mt-1 block">B/. (USD - Balboa)</span>
            <span className="text-[11px] text-[#86868B] mt-0.5 block">Paridad 1:1 con Dólar estadounidense</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#E5E5EA]">
            <span className="text-[#707070] block">Zona Horaria Oficial:</span>
            <span className="font-semibold text-sm text-[#1D1D1F] mt-1 block">America/Panama (UTC-5)</span>
            <span className="text-[11px] text-[#86868B] mt-0.5 block">Hora estándar de Panamá</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#E5E5EA]">
            <span className="text-[#707070] block">Formato de Fecha:</span>
            <span className="font-semibold text-sm text-[#1D1D1F] mt-1 block">DD/MM/AAAA</span>
            <span className="text-[11px] text-[#86868B] mt-0.5 block">Estándar hispanoamericano</span>
          </div>
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-[#0071E3]/5 border border-[#0071E3]/20 flex items-start gap-3 text-xs">
          <Info className="w-5 h-5 text-[#0071E3] shrink-0 mt-0.5" />
          <div className="text-[#0066CC] leading-relaxed">
            <strong className="block text-[#1D1D1F] font-semibold mb-0.5">
              Aviso de Cumplimiento Tributario de la República de Panamá:
            </strong>
            SmartPyme opera como un sistema de control interno, escandallo, ventas y gestión de inventario. La plataforma no emite facturas fiscales electrónicas oficiales certificadas por PAC (Proveedor de Autorización Calificada) ni sustituye equipos fiscales aprobados por la DGI (Dirección General de Ingresos) a menos que se configure una pasarela de facturación electrónica panameña autorizada.
          </div>
        </div>
      </section>

      {/* 4. Export Reports & Auditing */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5EA]/70 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E5E5EA]">
          <div className="p-2 rounded-2xl bg-[#0071E3]/10 text-[#0071E3]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1D1D1F]">Reportes y Descarga Contable</h3>
            <p className="text-xs text-[#707070]">Exportación de datos del negocio para contabilidad o archivo</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-xs font-semibold rounded-2xl border border-[#D6D6D6]/70 transition-colors"
          >
            Imprimir Informe General / PDF
          </button>
        </div>
      </section>

      {/* 5. Demonstration Data Management */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5EA]/70 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E5E5EA]">
          <div className="p-2.5 rounded-2xl bg-[#86868B]/10 text-[#1D1D1F]">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1D1D1F]">Gestión de Datos del Entorno</h3>
            <p className="text-xs text-[#707070]">
              Restaura o reinicia los datos demostrativos precargados
            </p>
          </div>
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-[#FAFAFC] border border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#1D1D1F]">
              Restablecer Datos de Muestra (Café Boquete)
            </p>
            <p className="text-[11px] text-[#707070] mt-0.5">
              Restaura el catálogo con café americano, capuchino, recetas formuladas, historial de ventas y movimientos de demostración.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm('¿Restablecer datos de muestra del Café Boquete?')) {
                resetToDemoData();
              }
            }}
            className="px-4 py-2 bg-white hover:bg-[#F5F5F7] text-[#FF3B30] border border-[#FF3B30]/30 text-xs font-semibold rounded-2xl transition-colors shrink-0"
          >
            Restablecer a Valores Iniciales
          </button>
        </div>
      </section>

      {/* Modal: Crear o Editar Usuario (Aplica para Carlos Mendoza y todos) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#D6D6D6] shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5EA]">
              <div>
                <h3 className="text-lg font-semibold text-[#1D1D1F]">
                  {editingUser ? 'Editar Perfil de Usuario' : 'Nuevo Perfil de Usuario'}
                </h3>
                <p className="text-xs text-[#707070] mt-0.5">
                  {editingUser ? `Modificando datos de ${editingUser.name}` : 'Agrega un empleado o administrador al negocio'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUserModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1.5 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="mt-5 space-y-4">
              {userError && (
                <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl text-xs text-[#D70015]">
                  {userError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza o Tu Nombre"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-[#F5F5F7] text-xs font-medium p-3 rounded-2xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="usuario@cafeboquete.pa"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-[#F5F5F7] text-xs font-medium p-3 rounded-2xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                  Rol y Permisos
                </label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <label
                    className={`p-3 rounded-2xl border cursor-pointer text-xs transition-all ${
                      newUserRole === 'employee'
                        ? 'border-[#0071E3] bg-[#0071E3]/5 text-[#1D1D1F]'
                        : 'border-[#E5E5EA] bg-[#FAFAFC] text-[#707070]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="employee"
                      checked={newUserRole === 'employee'}
                      onChange={() => setNewUserRole('employee')}
                      className="sr-only"
                    />
                    <p className="font-semibold text-[#1D1D1F]">Empleado</p>
                    <p className="text-[10px] text-[#707070] mt-0.5">Ventas y operaciones básicas</p>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border cursor-pointer text-xs transition-all ${
                      newUserRole === 'admin'
                        ? 'border-[#0071E3] bg-[#0071E3]/5 text-[#1D1D1F]'
                        : 'border-[#E5E5EA] bg-[#FAFAFC] text-[#707070]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={newUserRole === 'admin'}
                      onChange={() => setNewUserRole('admin')}
                      className="sr-only"
                    />
                    <p className="font-semibold text-[#1D1D1F]">Administrador</p>
                    <p className="text-[10px] text-[#707070] mt-0.5">Acceso total y configuración</p>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#707070] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
