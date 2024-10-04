/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import dayjs from 'dayjs';
import { Grid, NoticeBar } from 'react-vant';
import { FFDay } from '../utils/ffDay';
import { IKid } from '@faith-forge-web/models';

type Props = {
  visible: boolean;
  onClose: any;
  kid: IKid;
};

const ShowKidRegisteredModal = ({ visible, onClose, kid }: Props) => {
  const closeModal = () => {
    onClose(false);
  };

  const birthday = kid.birthday
    ? FFDay(new Date(kid.birthday))
        .tz('UTC')
        .locale('es')
        .format('MMMM D, YYYY')
    : '';

  const kidGuardianRegistration = kid.relations?.find(
    (relation) => relation.id === kid.currentKidRegistration?.guardianId,
  );

  return;

  // return (
  //   <CenterPopup
  //     showCloseButton
  //     visible={visible}
  //     onClose={closeModal}
  //     onMaskClick={closeModal}
  //     bodyStyle={{
  //       borderTopLeftRadius: '8px',
  //       borderTopRightRadius: '8px',
  //       padding: 5,
  //     }}
  //     style={{
  //       '--max-width': '90%',
  //       '--min-width': '90%',
  //     }}
  //   >
  //     <div
  //       style={{
  //         overflowY: 'scroll',
  //         minHeight: '80vh',
  //         maxHeight: '80vh',
  //         padding: '10px',
  //       }}
  //     >
  //       {/* <AutoCenter>
  //         <Image
  //           alt="profileImage"
  //           src={
  //             kid.photoUrl
  //               ? kid.photoUrl
  //               : kid.gender === UserGenderCode.MALE
  //               ? '/icons/boy.png'
  //               : '/icons/girl.png'
  //           }
  //           width={180}
  //           height={180}
  //           fit="cover"
  //           style={{ marginTop: 10, marginBottom: 10, borderRadius: '50%' }}
  //         />
  //         <h1
  //           style={{
  //             textAlign: 'center',
  //             fontSize: 32,
  //             marginTop: 5,
  //             marginBottom: 5,
  //           }}
  //         >
  //           {capitalizeWords(kid.firstName ?? '')}
  //         </h1>
  //         <h2
  //           style={{
  //             textAlign: 'center',
  //             fontSize: 22,
  //             marginTop: 0,
  //             marginBottom: 5,
  //           }}
  //         >
  //           {capitalizeWords(kid.lastName ?? '')}
  //         </h2>
  //       </AutoCenter> */}
  //       {birthday.slice(0, -6) ===
  //         dayjs(new Date()).locale('es').format('MMMM D') && (
  //         <NoticeBar
  //           text="¡¡¡HOY ES SU CUMPLEAÑOS!!!"
  //           color="info"
  //           leftIcon={<GiftOutlined />}
  //           style={{ marginBottom: '10px' }}
  //         />
  //       )}
  //       <div style={{ fontSize: 16 }}>
  //         {(kid.age || kid.age === 0) && kid.ageInMonths && (
  //           <Grid
  //             columnNum={2}
  //             gutter={8}
  //             style={{ paddingBottom: 10, border: '1px' }}
  //           >
  //             <Grid.Item style={{ fontWeight: 'bold' }}>Edad</Grid.Item>
  //             <Grid.Item>
  //               {`${Math.floor(kid.age ?? 0)} años y ${
  //                 kid.ageInMonths - Math.floor(kid.age) * 12
  //               } meses`}
  //             </Grid.Item>
  //           </Grid>
  //         )}
  //         {kid.birthday && (
  //           <Grid
  //             columnNum={2}
  //             gutter={8}
  //             style={{ paddingBottom: 10, border: '1px' }}
  //           >
  //             <Grid.Item style={{ fontWeight: 'bold' }}>
  //               Fecha de nacimiento
  //             </Grid.Item>
  //             <Grid.Item>{`${birthday}`}</Grid.Item>
  //           </Grid>
  //         )}
  //         {kid.gender && (
  //           <Grid
  //             columnNum={2}
  //             gutter={8}
  //             style={{ paddingBottom: 10, border: '1px' }}
  //           >
  //             <Grid.Item style={{ fontWeight: 'bold' }}>Género</Grid.Item>
  //             <Grid.Item>{`${
  //               USER_GENDER_CODE_MAPPER[kid.gender as any as UserGenderCode]
  //             }`}</Grid.Item>
  //           </Grid>
  //         )}
  //         {kid.healthSecurityEntity && (
  //           <Grid
  //             columnNum={2}
  //             gutter={8}
  //             style={{ paddingBottom: 10, border: '1px' }}
  //           >
  //             <Grid.Item style={{ fontWeight: 'bold' }}>EPS</Grid.Item>
  //             <Grid.Item>{kid.healthSecurityEntity}</Grid.Item>
  //           </Grid>
  //         )}
  //         {kid.currentKidRegistration && (
  //           <>
  //             <Grid
  //               columnNum={2}
  //               gutter={8}
  //               style={{ paddingBottom: 10, border: '1px' }}
  //             >
  //               <Grid.Item style={{ fontWeight: 'bold' }}>
  //                 Fecha de registro
  //               </Grid.Item>
  //               <Grid.Item>{`${dayjs(
  //                 kid.currentKidRegistration?.date.toString(),
  //               )
  //                 .locale('es')
  //                 .format('MMMM D, YYYY h:mm A')}`}</Grid.Item>
  //             </Grid>
  //             {kidGuardianRegistration && (
  //               <Grid
  //                 columnNum={2}
  //                 gutter={8}
  //                 style={{ paddingBottom: 10, border: '1px' }}
  //               >
  //                 <Grid.Item style={{ fontWeight: 'bold' }}>
  //                   Acudiente que registro
  //                 </Grid.Item>
  //                 <Grid.Item>{`${capitalizeWords(
  //                   kidGuardianRegistration.firstName,
  //                 )} ${capitalizeWords(
  //                   kidGuardianRegistration.lastName as '',
  //                 )} (${
  //                   KID_RELATION_CODE_MAPPER[kidGuardianRegistration.relation]
  //                 }) - Teléfono: ${kidGuardianRegistration.phone}`}</Grid.Item>
  //               </Grid>
  //             )}
  //             {kid.currentKidRegistration?.observation && (
  //               <Grid
  //                 columnNum={2}
  //                 gutter={8}
  //                 style={{ paddingBottom: 10, border: '1px' }}
  //               >
  //                 <Grid.Item style={{ fontWeight: 'bold' }}>
  //                   Observaciones al registrar
  //                 </Grid.Item>
  //                 <Grid.Item>{`${kid.currentKidRegistration?.observation}`}</Grid.Item>
  //               </Grid>
  //             )}
  //           </>
  //         )}
  //         {kid.medicalCondition && (
  //           <Grid
  //             columnNum={2}
  //             gutter={8}
  //             style={{ paddingBottom: 10, border: '1px' }}
  //           >
  //             <Grid.Item style={{ fontWeight: 'bold' }}>
  //               Condición Medica
  //             </Grid.Item>
  //             <Grid.Item>{`${kid.medicalCondition?.code} - ${kid.medicalCondition?.name}`}</Grid.Item>
  //           </Grid>
  //         )}
  //         {kid.observations && (
  //           <Grid
  //             columnNum={2}
  //             gutter={8}
  //             style={{ paddingBottom: 10, border: '1px' }}
  //           >
  //             <Grid.Item style={{ fontWeight: 'bold' }}>
  //               Observaciones generales
  //             </Grid.Item>
  //             <Grid.Item>{kid.observations}</Grid.Item>
  //           </Grid>
  //         )}
  //         {kid.kidGroup && (
  //           <Grid
  //             columnNum={2}
  //             gutter={8}
  //             style={{ paddingBottom: 10, border: '1px' }}
  //           >
  //             <Grid.Item style={{ fontWeight: 'bold' }}>Salón</Grid.Item>
  //             <Grid.Item>
  //               {kid.kidGroup.name} {kid.staticGroup ? '(Estatico)' : ''}
  //             </Grid.Item>
  //           </Grid>
  //         )}
  //       </div>
  //       <h2
  //         style={{
  //           textAlign: 'center',
  //           fontSize: 22,
  //           marginTop: 25,
  //           marginBottom: 5,
  //         }}
  //       >
  //         Acudientes
  //       </h2>
  //       <table
  //         width={'100%'}
  //         style={{
  //           marginTop: '5px',
  //           marginBottom: '10px',
  //           border: '1px solid black',
  //         }}
  //       >
  //         <thead>
  //           <tr>
  //             <th>Nombre</th>
  //             <th>Relación</th>
  //             <th>Teléfono</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           {kid.relations?.map((kidGuardian) => {
  //             return (
  //               <tr key={kidGuardian.id}>
  //                 <td>
  //                   {capitalizeWords(kidGuardian.firstName)}{' '}
  //                   {capitalizeWords(kidGuardian.lastName as '')}
  //                 </td>
  //                 <td>{KID_RELATION_CODE_MAPPER[kidGuardian.relation]}</td>
  //                 <td>{kidGuardian.phone}</td>
  //               </tr>
  //             );
  //           })}
  //         </tbody>
  //       </table>
  //     </div>
  //   </CenterPopup>
  // );
};

export default ShowKidRegisteredModal;
