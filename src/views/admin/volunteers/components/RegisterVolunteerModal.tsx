import React, { useEffect, useState, useRef } from 'react';
import AppDrawer from '@/components/ui/AppDrawer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { IUser } from '@/libs/models';
import { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';
import { GetUsers } from '@/libs/state/redux/thunks/user/user.thunk';
import { CreateVolunteer, GetVolunteers } from '@/libs/state/redux/thunks/church/volunteer.thunk';
import { useModalBackClose } from '@/libs/hooks/useModalBackClose';
import { toast } from 'sonner';
import { UserPlus, User as UserIcon, Check } from 'lucide-react';

interface RegisterVolunteerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Modal drawer to search an existing user from User MS and register them as a Volunteer.
 *
 * @param {RegisterVolunteerModalProps} props - Component properties.
 * @returns {JSX.Element} The rendered modal drawer.
 */
export const RegisterVolunteerModal: React.FC<RegisterVolunteerModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  useModalBackClose(open, () => onOpenChange(false));

  const dispatch = useAppDispatch();
  const existingVolunteers = useAppSelector((state) => state.volunteerSlice.volunteers);

  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      setSearchText('');
      setSearchResults([]);
      setSelectedUser(null);
    }
  }, [open]);

  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await dispatch(GetUsers({ findText: searchText.trim() })).unwrap();
        const usersList: IUser[] = res?.data || [];
        setSearchResults(usersList);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Por favor selecciona un usuario');
      return;
    }

    const alreadyVolunteer = existingVolunteers.some((v) => v.userId === selectedUser.id);
    if (alreadyVolunteer) {
      toast.info('Este usuario ya está registrado en el directorio de servidores');
      onOpenChange(false);
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(CreateVolunteer({ userId: selectedUser.id })).unwrap();
      await dispatch(GetVolunteers({ force: true }));
      toast.success('Servidor registrado correctamente');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const errMsg = typeof err === 'string' ? err : 'Error al registrar el servidor';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar Servidor"
      icon={<UserPlus className="text-primary" size={20} />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Buscar Usuario <span className="text-rose-500">*</span>
          </label>
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar por nombre o cédula..."
            icon="search"
            onClear={() => setSearchText('')}
            autoFocus
          />

          {searching && (
            <p className="text-xs text-gray-400 mt-1">Buscando usuarios...</p>
          )}

          {searchResults.length > 0 && !selectedUser && (
            <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white divide-y divide-gray-100 shadow-sm">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setSearchText('');
                    setSearchResults([]);
                  }}
                  className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-gray-600 flex items-center justify-center shrink-0">
                      {user.photoUrl ? (
                        <img
                          src={user.photoUrl}
                          alt={user.firstName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <UserIcon size={14} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        Doc: {user.nationalId || 'S/N'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                    Elegir
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedUser && (
          <div className="p-3 bg-slate-50 border border-primary/40 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {selectedUser.photoUrl ? (
                  <img
                    src={selectedUser.photoUrl}
                    alt={selectedUser.firstName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <UserIcon size={16} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  Doc: {selectedUser.nationalId || 'S/N'} • Tel: {selectedUser.phone || 'S/T'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUser(null)}
              className="text-xs text-gray-500"
            >
              Cambiar
            </Button>
          </div>
        )}

        <div className="pt-2 flex gap-3">
          <Button
            type="button"
            variant="default"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={submitting}
            loadingText="Registrando..."
            disabled={!selectedUser}
          >
            Registrar Servidor
          </Button>
        </div>
      </form>
    </AppDrawer>
  );
};

export default RegisterVolunteerModal;
