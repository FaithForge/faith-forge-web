import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, QrCode, Printer, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { APP_ROUTES } from "@/config/routes";
import Button from '@/components/ui/Button';
import UpdateGuardianModal from "@/components/modal/UpdateGuardianModal";

const KidCheckInView = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Could use the kid ID from route params to fetch data
  
  // Mock flag para demostrar los dos estados (Registrado vs No Registrado)
  const [isRegistered, setIsRegistered] = useState(true); 
  
  const [observation, setObservation] = useState('');
  const [selectedGuardian, setSelectedGuardian] = useState('g1');
  
  // Estado para el modal de actualizar acudiente
  const [selectedGuardianToUpdate, setSelectedGuardianToUpdate] = useState<{name: string, phone: string, relation: string} | null>(null);

  const handleUpdateGuardian = (guardianInfo: {name: string, phone: string, relation: string}) => {
    setSelectedGuardianToUpdate(guardianInfo);
  };

  const handleCheckIn = () => {
    toast.success("¡Etiqueta de registro enviada a impresión!");
    setIsRegistered(true);
  };

  const handleReprint = () => {
    toast.success("¡Reimprimiendo etiqueta!");
  };

  const handleDelete = () => {
    toast.success("Registro eliminado");
    setIsRegistered(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* TopBar */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center shadow-md">
        <button onClick={() => navigate(APP_ROUTES.kidRegistration.root)} className="flex items-center gap-1 opacity-90 hover:opacity-100">
          <ArrowLeft size={20} />
          <span className="font-medium">Detalle y Registro</span>
        </button>
      </div>

      <div className="p-4 animate-in fade-in slide-in-from-right-4 duration-300">
        
        {/* Cabecera del Niño */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
          <div className="flex gap-4 items-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
               {/* Usarías la foto real aquí */}
              <img src="/icons/boy-v2.png" alt="Avatar" className="w-full h-full object-cover opacity-50" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Abby Castelar Arrieta</h3>
              <h4 className="text-sm text-gray-500 font-medium mt-0.5">Código: {id || '113388'} • Edad: 5 años</h4>
              <span className="inline-block px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-bold mt-2">Párvulos</span>
            </div>
          </div>
        </div>

        {isRegistered ? (
          /* VISTA DE NIÑO YA REGISTRADO (INFO DETALLADA Y TABLA) */
          <>
            {/* Información del registro */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">Información del registro</h2>
              <div className="flex flex-col gap-y-4 text-sm">
                <div className="flex gap-x-4">
                  <div className="w-2/5 font-bold text-gray-600">Fecha de registro</div>
                  <div className="w-3/5 text-gray-800">Agosto 21, 2026 9:15 AM</div>
                </div>
                <div className="flex gap-x-4">
                  <div className="w-2/5 font-bold text-gray-600">Acudiente que registró</div>
                  <div className="w-3/5 text-gray-800">Maria Arrieta (Madre) <br/> Tel: +57 300 123 4567</div>
                </div>
                <div className="flex gap-x-4">
                  <div className="w-2/5 font-bold text-gray-600">Observaciones</div>
                  <div className="w-3/5 text-gray-800">Lleva bolso rojo, no ha merendado.</div>
                </div>
              </div>
            </div>

            {/* Tabla de Acudientes */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">Acudientes</h2>
              <div className="grid grid-cols-12 gap-x-2 gap-y-3 text-xs items-center">
                {/* Encabezados */}
                <div className="col-span-4 font-bold text-gray-500 uppercase">Nombre</div>
                <div className="col-span-3 font-bold text-gray-500 uppercase">Relación</div>
                <div className="col-span-4 font-bold text-gray-500 uppercase">Teléfono</div>
                <div className="col-span-1"></div>

                {/* Filas */}
                <div className="col-span-12 border-t border-gray-50 my-0.5"></div>
                
                <div className="col-span-4 text-gray-800 font-medium leading-tight">Maria Arrieta</div>
                <div className="col-span-3 text-gray-600">Madre</div>
                <div className="col-span-4 text-gray-600">+57 300 123 4567</div>
                <div className="col-span-1 flex justify-end">
                  <button 
                    onClick={() => handleUpdateGuardian({ name: 'Maria Arrieta', phone: '+57 300 123 4567', relation: 'Madre' })}
                    className="text-primary p-2 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
                  >
                    <Pencil size={14}/>
                  </button>
                </div>

                <div className="col-span-12 border-t border-gray-50 my-0.5"></div>

                <div className="col-span-4 text-gray-800 font-medium leading-tight">Pedro Castelar</div>
                <div className="col-span-3 text-gray-600">Padre</div>
                <div className="col-span-4 text-gray-600">+57 301 987 6543</div>
                <div className="col-span-1 flex justify-end">
                  <button 
                    onClick={() => handleUpdateGuardian({ name: 'Pedro Castelar', phone: '+57 301 987 6543', relation: 'Padre' })}
                    className="text-primary p-2 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
                  >
                    <Pencil size={14}/>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handleReprint} block variant="primary">
                <Printer size={18} className="mr-2 inline" /> Reimprimir registro
              </Button>
              
              <Button onClick={handleDelete} block variant="danger">
                <Trash2 size={18} className="mr-2 inline" /> Eliminar Registro
              </Button>
            </div>
          </>
        ) : (
          /* FORMULARIO DE CHECK-IN (NO REGISTRADO) */
          <>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase">¿Quién lo entrega?</label>
                <div className="flex flex-col gap-3">
                  
                  <label className="flex items-center gap-3 p-3 border-2 border-primary bg-primary/5 rounded-xl cursor-pointer transition-colors relative">
                    <input 
                      type="radio" 
                      name="guardian" 
                      checked={selectedGuardian === 'g1'} 
                      onChange={() => setSelectedGuardian('g1')}
                      className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">Maria Arrieta (Madre)</p>
                      <p className="text-sm text-gray-500">Tel: +57 300 123 4567</p>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault(); // Evita que se dispare el radio button si se hace clic en el lapiz
                        handleUpdateGuardian({ name: 'Maria Arrieta', phone: '+57 300 123 4567', relation: 'Madre' });
                      }}
                      className="text-primary p-2 bg-white rounded-full hover:bg-primary/10 shadow-sm border border-primary/20 transition-colors"
                    >
                      <Pencil size={14}/>
                    </button>
                  </label>

                  <label className="flex items-center gap-3 p-3 border-2 border-transparent bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors relative">
                    <input 
                      type="radio" 
                      name="guardian" 
                      checked={selectedGuardian === 'g2'}
                      onChange={() => setSelectedGuardian('g2')}
                      className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">Pedro Castelar (Padre)</p>
                      <p className="text-sm text-gray-500">Tel: +57 301 987 6543</p>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleUpdateGuardian({ name: 'Pedro Castelar', phone: '+57 301 987 6543', relation: 'Padre' });
                      }}
                      className="text-primary p-2 bg-white rounded-full hover:bg-primary/10 shadow-sm border border-gray-200 transition-colors"
                    >
                      <Pencil size={14}/>
                    </button>
                  </label>
                  
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Observaciones al registrar (Check-in)</label>
                <textarea 
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white text-text-main py-2.5 px-3 focus:border-primary focus:ring-0 transition-colors outline-none text-base shadow-sm"
                  rows={3}
                  maxLength={300}
                  placeholder="Ej: lleva bolso, no ha merendado..."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                ></textarea>
              </div>
            </div>

            <Button onClick={handleCheckIn} block variant="success">
              <QrCode size={20} className="mr-2 inline" /> Registrar e Imprimir Etiqueta
            </Button>
          </>
        )}
      </div>

      <UpdateGuardianModal 
        open={!!selectedGuardianToUpdate} 
        onClose={() => setSelectedGuardianToUpdate(null)} 
        guardian={selectedGuardianToUpdate} 
      />
    </div>
  );
};

export default KidCheckInView;
