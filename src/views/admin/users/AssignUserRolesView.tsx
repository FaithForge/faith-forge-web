import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Loader2, 
  User as UserIcon, 
  ShieldCheck, 
  ShieldPlus, 
  Sparkles,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { useAppDispatch } from '@/libs/state/redux/hooks';
import { GetUserByNationalId, AssignUserRole } from '@/libs/state/redux/thunks/user/user.thunk';
import { IUser } from '@/libs/models/User';
import { UserRole, ALL_SYSTEM_ROLES_METADATA } from '@/libs/utils/auth';
import { APP_ROUTES } from '@/config/routes';
import Input from '@/components/ui/Input';
import SelectSearch from '@/components/ui/SelectSearch';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';

/**
 * View for Searching and Assigning Roles to Users.
 */
const AssignUserRolesView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Estados de búsqueda
  const [searchNationalId, setSearchNationalId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [foundUser, setFoundUser] = useState<IUser | null>(null);

  // Estados de asignación
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  /**
   * Executes user search by national ID / document number.
   */
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanId = searchNationalId.trim();
    if (!cleanId) {
      toast.error('Ingresa un número de documento para buscar');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setFoundUser(null);
    setSelectedRoleToAssign('');

    try {
      const response = await dispatch(GetUserByNationalId(cleanId)).unwrap();
      if (response) {
        setFoundUser(response);
      } else {
        toast.info('No se encontró ningún usuario con ese número de documento');
      }
    } catch (error: any) {
      toast.info(error?.message || error || 'No se encontró ningún usuario con ese número de documento');
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Assigns the selected new role to current user.
   */
  const handleAssignRole = async () => {
    if (!foundUser) return;
    if (!selectedRoleToAssign) {
      toast.error('Selecciona un rol para asignar');
      return;
    }

    const roleEnum = selectedRoleToAssign as UserRole;
    if (foundUser.roles?.includes(roleEnum)) {
      toast.info('El usuario ya cuenta con este rol asignado');
      return;
    }

    setIsAssigning(true);

    try {
      await dispatch(
        AssignUserRole({
          userId: foundUser.id,
          userRole: roleEnum,
        })
      ).unwrap();

      toast.success(`¡Rol "${ALL_SYSTEM_ROLES_METADATA[roleEnum]?.name || roleEnum}" asignado con éxito!`);

      // Update user roles in local view state
      setFoundUser((prev) => {
        if (!prev) return null;
        const currentRoles = prev.roles || [];
        return {
          ...prev,
          roles: [...currentRoles, roleEnum],
        };
      });

      setSelectedRoleToAssign('');
    } catch (err: any) {
      toast.error(err?.message || err?.error || 'Error al asignar el rol');
    } finally {
      setIsAssigning(false);
    }
  };

  // Available roles to assign (excluding existing roles user already has)
  const availableRolesToAssign = Object.values(UserRole)
    .filter((role) => role !== UserRole.KID) // Excluir rol KID de asignaciones
    .filter((role) => !foundUser?.roles?.includes(role))
    .map((role) => {
      const meta = ALL_SYSTEM_ROLES_METADATA[role];
      return {
        id: role,
        name: meta ? `${meta.name} (${meta.category})` : role,
      };
    });

  return (
    <div className="min-h-full flex-1 w-full bg-slate-50 pb-20">
      <PageHeader title="Asignar Roles" onBack={() => navigate(APP_ROUTES.admin.root)} />

      <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
        
        {/* Search by Document Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Search size={14} />
            </div>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Buscar Usuario por Cédula / Documento
            </h2>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <Input
                label="Número de Documento"
                placeholder="Escribir número de documento..."
                value={searchNationalId}
                onChange={(e) => setSearchNationalId(e.target.value)}
                onClear={() => setSearchNationalId('')}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={isSearching || !searchNationalId.trim()}
              className="py-2.5 px-5 h-[46px] font-bold text-sm shrink-0 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Buscando...
                </>
              ) : (
                <>
                  <Search size={18} /> Buscar
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Not Found State */}
        {hasSearched && !isSearching && !foundUser && (
          <div className="bg-white rounded-2xl p-8 border border-gray-200/80 shadow-xs text-center flex flex-col items-center animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-bold text-gray-800 text-base">No se encontró el usuario</h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              Verifica que el número de cédula esté escrito correctamente o crea el usuario primero en el panel.
            </p>
          </div>
        )}

        {/* Found User Information */}
        {foundUser && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-3 duration-300">
            
            {/* Card 1: User Profile */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs">
              <div className="flex items-center gap-4">
                <div className={clsx(
                  'w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 flex items-center justify-center shrink-0 shadow-xs',
                  foundUser.gender === 'F' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'
                )}>
                  {foundUser.photoUrl ? (
                    <img src={foundUser.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={32} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-lg text-gray-900 truncate">
                      {foundUser.firstName} {foundUser.lastName}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {foundUser.state || 'ACTIVO'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    {foundUser.nationalIdType || 'CC'}: <span className="font-bold text-gray-700">{foundUser.nationalId}</span>
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
                    {foundUser.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} className="text-gray-400" /> {foundUser.phone}
                      </span>
                    )}
                    {foundUser.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={12} className="text-gray-400" /> {foundUser.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Roles Actuales */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShieldCheck size={14} />
                  </div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                    Roles Asignados ({foundUser.roles?.length || 0})
                  </h2>
                </div>
              </div>

              {(!foundUser.roles || foundUser.roles.length === 0) ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-gray-500">
                  Este usuario no tiene ningún rol asignado actualmente.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {foundUser.roles.map((role) => {
                    const meta = ALL_SYSTEM_ROLES_METADATA[role];
                    return (
                      <div
                        key={role}
                        className="p-3 rounded-xl border border-gray-100 bg-slate-50/80 flex items-start gap-3 shadow-2xs"
                      >
                        <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-primary flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-gray-900 truncate">
                              {meta?.name || role}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                            {meta?.description || meta?.category || 'Rol del sistema'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card 3: Asignar Nuevo Rol */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-200/80 bg-emerald-50/10 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldPlus size={14} />
                </div>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                  Asignar Nuevo Rol
                </h2>
              </div>

              {availableRolesToAssign.length === 0 ? (
                <div className="p-4 bg-emerald-50 rounded-xl text-center text-xs text-emerald-800 font-medium">
                  ✨ El usuario ya tiene asignados todos los roles disponibles en el sistema.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <SelectSearch
                      label="Seleccionar Rol"
                      placeholder="Seleccionar rol para asignar..."
                      options={availableRolesToAssign}
                      value={selectedRoleToAssign}
                      onChange={setSelectedRoleToAssign}
                      searchable={true}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    disabled={isAssigning || !selectedRoleToAssign}
                    onClick={handleAssignRole}
                    className="py-2.5 px-5 h-[46px] font-bold text-sm shrink-0 w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    {isAssigning ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Asignando...
                      </>
                    ) : (
                      <>
                        <ShieldPlus size={18} /> Asignar Rol
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default AssignUserRolesView;
