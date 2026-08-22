import React from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { APP_ROUTES } from "@/config/routes";
import Cell from '@/components/ui/Cell';

const kidsMock = [
  { id: '113388', name: 'Abby Castelar Arrieta', gender: 'F' },
  { id: '113387', name: 'Luciana Barrio Mesa', gender: 'F' },
  { id: '113386', name: 'Noah Alejandro Osorio Rios', gender: 'M' },
  { id: '113385', name: 'Sara Belen Mendoza Julio', gender: 'F' },
  { id: '113384', name: 'Elias David Mendoza Julio', gender: 'M' },
  { id: '113383', name: 'Said Cuavas Cabrera', gender: 'M' },
  { id: '113382', name: 'Salome Barrios Romero', gender: 'F' },
  { id: '113381', name: 'Natalia Karolina Mendoza', gender: 'F' },
  { id: '113380', name: 'Mateo Alejandro Rodríguez', gender: 'M' },
  { id: '113379', name: 'Valeria Sofía Martínez', gender: 'F', photoUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
  { id: '113378', name: 'Santiago Andrés Castro', gender: 'M' },
  { id: '113377', name: 'Isabella Marie Santos', gender: 'F' },
  { id: '113376', name: 'Thiago Gabriel Romero', gender: 'M' },
  { id: '113375', name: 'Mía Victoria Suárez', gender: 'F' },
  { id: '113374', name: 'Lucas Daniel Torres', gender: 'M' },
];

const RegistrationDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-3 flex flex-col gap-3">
      {/* Search Bar */}
      <div className="sticky top-0 z-20 bg-background py-2 -mx-3 px-3">
        <Input 
          icon="search" 
          placeholder="Buscar niño" 
          wrapperClassName="mb-0"
          className="border-0 bg-white shadow-sm text-base focus:ring-0 transition-colors"
        />
      </div>

      {/* Alerts */}
      <Alert 
        type="error"
        message="Estás en un servicio posterior al actual. Por favor elige un servicio adecuado."
      />
      
      <Alert 
        type="info"
        title="Impresora: PRINCIPAL_PRINT_01"
        message="Reunión: Viernes de Fe y Milagros (Villagrande de Indias 2)"
        className="bg-cyan-100 text-cyan-800 border-cyan-200"
      />

      {/* Lista de Niños */}
      <div className="flex flex-col gap-2 mt-1">
        {kidsMock.map((kid) => (
          <Cell 
            key={kid.id}
            title={kid.name}
            subtitle={`Codigo: ${kid.id}`}
            gender={kid.gender}
            photoUrl={kid.photoUrl}
            onClick={() => navigate(APP_ROUTES.kidRegistration.checkIn(kid.id))}
          />
        ))}
      </div>
      
    </div>
  );
};

export default RegistrationDashboard;
