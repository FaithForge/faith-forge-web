const fs = require('fs');
const path = 'src/views/kid-registration/KidCheckInView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /import \{ useNavigate, useParams \} from 'react-router-dom';/,
  `import { useNavigate, useParams } from 'react-router-dom';\nimport { useEffect } from 'react';\nimport { useAppDispatch, useAppSelector } from '@/libs/state/redux/hooks';\nimport { GetKid } from '@/libs/state/redux/thunks/kid-church/kid.thunk';\nimport { CreateKidRegistration, ReprintKidRegistration, RemoveKidRegistration } from '@/libs/state/redux/thunks/kid-church/kid-registration.thunk';\nimport dayjs from 'dayjs';\nimport { Loader2 } from 'lucide-react';`
);

content = content.replace(
  /const KidCheckInView = \(\) => \{[\s\S]*?const navigate = useNavigate\(\);[\s\S]*?const \{ id \} = useParams\(\);[^\n]*\n/,
  `const KidCheckInView = () => {\n  const navigate = useNavigate();\n  const { id } = useParams();\n  const dispatch = useAppDispatch();\n\n  const { current: kid, loading } = useAppSelector(state => state.kidSlice);\n\n  useEffect(() => {\n    if (id) {\n      dispatch(GetKid({ id }));\n    }\n  }, [id, dispatch]);\n\n`
);

content = content.replace(
  /\/\/ Mock flag para demostrar los dos estados \(Registrado vs No Registrado\)[\s\S]*?const \[isRegistered, setIsRegistered\] = useState\(true\);/,
  `const isRegistered = !!kid?.currentKidRegistration;`
);

// handleCheckIn
content = content.replace(
  /const handleCheckIn = \(\) => \{[\s\S]*?toast\.success\("¡Etiqueta de registro enviada a impresión!"\);[\s\S]*?setIsRegistered\(true\);[\s\S]*?\};/,
  `const handleCheckIn = async () => {\n    if (!kid || !selectedGuardian) return;\n    try {\n      await dispatch(CreateKidRegistration({ kidId: kid.id, observation, guardianId: selectedGuardian })).unwrap();\n      toast.success("¡Etiqueta de registro enviada a impresión!");\n      dispatch(GetKid({ id: kid.id }));\n    } catch (err) {\n      toast.error("Error al registrar");\n    }\n  };`
);

// handleReprint
content = content.replace(
  /const handleReprint = \(\) => \{[\s\S]*?toast\.success\("¡Reimprimiendo etiqueta!"\);[\s\S]*?\};/,
  `const handleReprint = async () => {\n    if (!kid?.currentKidRegistration) return;\n    try {\n      await dispatch(ReprintKidRegistration({ id: kid.currentKidRegistration.id, copies: 1 })).unwrap();\n      toast.success("¡Reimprimiendo etiqueta!");\n    } catch (err) {\n      toast.error("Error al reimprimir");\n    }\n  };`
);

// handleDelete
content = content.replace(
  /const handleDelete = \(\) => \{[\s\S]*?toast\.success\("Registro eliminado"\);[\s\S]*?setIsRegistered\(false\);[\s\S]*?\};/,
  `const handleDelete = async () => {\n    if (!kid?.currentKidRegistration) return;\n    try {\n      await dispatch(RemoveKidRegistration({ id: kid.currentKidRegistration.id })).unwrap();\n      toast.success("Registro eliminado");\n      dispatch(GetKid({ id: kid.id }));\n    } catch (err) {\n      toast.error("Error al eliminar registro");\n    }\n  };`
);

// Render values replacements
content = content.replace(/Abby Castelar Arrieta/g, '{kid ? `${kid.firstName} ${kid.lastName}` : ""}');
content = content.replace(/\{id \|\| '113388'\}/g, '{kid?.faithForgeId || kid?.id}');
content = content.replace(/5 años/g, '{kid?.age || 0} años');
content = content.replace(/Párvulos/g, '{kid?.kidGroup?.name || ""}');

content = content.replace(/Agosto 21, 2026 9:15 AM/g, '{kid?.currentKidRegistration?.date ? dayjs(kid.currentKidRegistration.date).format("MMMM D, YYYY h:mm A") : ""}');
content = content.replace(/Maria Arrieta \(Madre\) <br\/> Tel: \+57 300 123 4567/g, '{kid?.currentKidRegistration?.additionalInfo?.guardianFullName || kid?.currentKidRegistration?.log || "Acudiente"}');
content = content.replace(/Lleva bolso rojo, no ha merendado\./g, '{kid?.currentKidRegistration?.observation || "Ninguna"}');
content = content.replace(/<img src="\/icons\/boy-v2\.png" alt="Avatar" className="w-full h-full object-cover opacity-50" \/>/g, `{kid?.photoUrl ? <img src={kid.photoUrl} alt="Avatar" className="w-full h-full object-cover" /> : <img src="/icons/boy-v2.png" alt="Avatar" className="w-full h-full object-cover opacity-50" />}`);

// Guardian map
content = content.replace(
  /<div className="contents">[\s\S]*?\{\/\* MOCK GUARDIANS END \*\/\}[\s\S]*?<\/div>/,
  `{kid?.relations?.map((relation: any) => (
                  <div key={relation.id} className="contents border-b border-gray-50 last:border-0 group">
                    <div className="col-span-4 py-2 font-medium text-gray-800 break-words">{relation.guardian.firstName} {relation.guardian.lastName}</div>
                    <div className="col-span-3 py-2 text-gray-600">{relation.relationCode}</div>
                    <div className="col-span-4 py-2 text-gray-600">{relation.guardian.dialCodePhone} {relation.guardian.phone}</div>
                    <div className="col-span-1 py-2 text-right">
                      <button 
                        onClick={() => handleUpdateGuardian({ name: relation.guardian.firstName, phone: relation.guardian.phone, relation: relation.relationCode })}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>`
);

// Select options
content = content.replace(
  /<option value="g1">Maria Arrieta \(Madre\)<\/option>\n[\s\S]*?<option value="g2">Juan Castelar \(Padre\)<\/option>/,
  `{kid?.relations?.map((r: any) => (
                      <option key={r.guardian.id} value={r.guardian.id}>{r.guardian.firstName} {r.guardian.lastName} ({r.relationCode})</option>
                    ))}`
);

content = content.replace(/<div className="p-4 animate-in fade-in slide-in-from-right-4 duration-300">/, `<div className="p-4 animate-in fade-in slide-in-from-right-4 duration-300">\n        {loading && <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={32} /></div>}\n        {!loading && kid && (`);

content = content.replace(/<\/UpdateGuardianModal>\n    <\/div>\n  \);\n\};\n\nexport default KidCheckInView;/, `</UpdateGuardianModal>\n        )}\n    </div>\n  );\n};\n\nexport default KidCheckInView;`);

fs.writeFileSync(path, content);
