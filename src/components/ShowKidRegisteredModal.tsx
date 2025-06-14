import dayjs from 'dayjs';
import { Card, NoticeBar, Popup } from 'react-vant';
import { LiaBirthdayCakeSolid } from 'react-icons/lia';
import TagKidGroupApp from './TagKidGroupApp';
import {
  IKid,
  UserGenderCode,
  USER_GENDER_CODE_MAPPER,
  KID_RELATION_CODE_MAPPER,
  IKidGuardian,
  KidGuardianRelationCodeEnum,
} from '@/libs/models';
import { GetUserRoles, IsSupervisorRegisterKidChurch } from '@/libs/utils/auth';
import { FFDay } from '@/libs/utils/ffDay';
import { capitalizeWords } from '@/libs/utils/text';

type Props = {
  visible: boolean;
  onClose: (visible: boolean) => void;
  kid: IKid;
};

const ShowKidRegisteredModal = ({ visible, onClose, kid }: Props) => {
  const roles = GetUserRoles();
  const closeModal = () => {
    onClose(false);
  };

  const birthday = kid.birthday
    ? FFDay(new Date(kid.birthday)).tz('UTC').locale('es').format('MMMM D, YYYY')
    : '';

  const kidGuardianRegistration = kid.relations?.find(
    (relation) => relation.id === kid.currentKidRegistration?.guardianId,
  );

  const imageProfile = kid.photoUrl
    ? kid.photoUrl
    : kid.gender === UserGenderCode.MALE
      ? '/icons/boy-v2.png'
      : '/icons/girl-v2.png';

  return (
    <Popup
      visible={visible}
      closeable
      title="Información del Niño"
      style={{ height: '90%' }}
      position="bottom"
      round
      onClose={closeModal}
    >
      <div style={{ paddingLeft: 15, paddingRight: 15 }}>
        <div className="flex justify-center items-center gap-4 pb-2.5">
          {/* Imagen */}
          <div className="w-1/3">
            <img
              alt="profileImage"
              src={imageProfile}
              className="object-cover rounded-full mt-2.5 mb-2.5"
              // onClick={() =>
              //   ImagePreview.open({
              //     closeable: true,
              //     showIndex: false,
              //     images: [imageProfile],
              //   })
              // }
            />
          </div>

          {/* Nombre y Grupo */}
          <div className="w-2/3">
            <h1 className="text-[28px] mt-1.5 mb-1.5">{capitalizeWords(kid.firstName ?? '')}</h1>
            <h2 className="text-[20px] mt-0 mb-1.5">{capitalizeWords(kid.lastName ?? '')}</h2>
            {kid.kidGroup && (
              <TagKidGroupApp kidGroup={kid.kidGroup.name} staticGroup={kid.staticGroup} />
            )}
          </div>
        </div>
        {birthday.slice(0, -6) === dayjs(new Date()).locale('es').format('MMMM D') && (
          <NoticeBar
            text="¡¡¡HOY ES SU CUMPLEAÑOS!!!"
            background="rgb(249, 249, 249)"
            leftIcon={<LiaBirthdayCakeSolid />}
            style={{ marginBottom: '10px', textAlign: 'center' }}
          />
        )}
        <Card round style={{ backgroundColor: '#f9f9f9', marginBottom: 10 }}>
          <Card.Header border>Datos del niño</Card.Header>
          <Card.Body>
            <div className="flex flex-col gap-y-4">
              {kid.faithForgeId && (
                <div className="flex gap-x-4">
                  <div className="w-1/2 font-bold">Código de aplicación</div>
                  <div className="w-1/2">{kid.faithForgeId}</div>
                </div>
              )}

              {(kid.age || kid.age === 0) && kid.ageInMonths && (
                <div className="flex gap-x-4">
                  <div className="w-1/2 font-bold">Edad</div>
                  <div className="w-1/2">
                    {`${Math.floor(kid.age ?? 0)} años y ${
                      kid.ageInMonths - Math.floor(kid.age) * 12
                    } meses`}
                  </div>
                </div>
              )}

              {kid.birthday && (
                <div className="flex gap-x-4">
                  <div className="w-1/2 font-bold">Fecha de nacimiento</div>
                  <div className="w-1/2">{birthday}</div>
                </div>
              )}

              {kid.gender && (
                <div className="flex gap-x-4">
                  <div className="w-1/2 font-bold">Género</div>
                  <div className="w-1/2">{USER_GENDER_CODE_MAPPER[kid.gender]}</div>
                </div>
              )}

              {kid.healthSecurityEntity && (
                <div className="flex gap-x-4">
                  <div className="w-1/2 font-bold">EPS</div>
                  <div className="w-1/2">{kid.healthSecurityEntity}</div>
                </div>
              )}

              {kid.medicalCondition && (
                <div className="flex gap-x-4">
                  <div className="w-1/2 font-bold">Condición Médica</div>
                  <div className="w-1/2">
                    {`${kid.medicalCondition?.code} - ${kid.medicalCondition?.name}`}
                  </div>
                </div>
              )}

              {kid.observations && (
                <div className="flex gap-x-4">
                  <div className="w-1/2 font-bold">Observaciones generales</div>
                  <div className="w-1/2">{kid.observations}</div>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

        {kid.currentKidRegistration && (
          <>
            <Card round style={{ backgroundColor: '#f9f9f9' }}>
              <Card.Header border>Información del registro</Card.Header>
              <Card.Body>
                <div className="flex flex-col gap-y-4">
                  <div className="flex gap-x-4">
                    <div className="w-1/2 font-bold">Fecha de registro</div>
                    <div className="w-1/2">
                      {`${dayjs(kid.currentKidRegistration?.date.toString())
                        .locale('es')
                        .format('MMMM D, YYYY h:mm A')}`}
                    </div>
                  </div>

                  {kidGuardianRegistration && (
                    <div className="flex gap-x-4">
                      <div className="w-1/2 font-bold">Acudiente que registró</div>
                      <div className="w-1/2">
                        {`${capitalizeWords(kidGuardianRegistration.firstName)} ${capitalizeWords(
                          kidGuardianRegistration.lastName as '',
                        )} (${KID_RELATION_CODE_MAPPER[kidGuardianRegistration.relation]}) - Teléfono: ${
                          kidGuardianRegistration.dialCodePhone
                        } ${kidGuardianRegistration.phone}`}
                      </div>
                    </div>
                  )}

                  {kid.currentKidRegistration?.observation && (
                    <div className="flex gap-x-4">
                      <div className="w-1/2 font-bold">Observaciones al registrar</div>
                      <div className="w-1/2">{kid.currentKidRegistration.observation}</div>
                    </div>
                  )}

                  {IsSupervisorRegisterKidChurch(roles) && kid.currentKidRegistration?.log && (
                    <div className="flex gap-x-4">
                      <div className="w-1/2 font-bold">Log de registro</div>
                      <div className="w-1/2">{kid.currentKidRegistration.log}</div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
            <Card
              round
              style={{
                backgroundColor: '#f9f9f9',
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              <Card.Header border>Acudientes</Card.Header>
              <Card.Body>
                <div className="flex flex-col gap-y-4">
                  {/* Encabezados */}
                  <div className="flex flex-wrap gap-x-2">
                    <div className="w-[40%] font-bold">Nombre</div> {/* 10/24 = ~41.67% */}
                    <div className="w-[20%] font-bold">Relación</div> {/* 5/24 = ~20.83% */}
                    <div className="w-[30%] font-bold">Teléfono</div> {/* 9/24 = ~37.5% */}
                  </div>

                  {/* Datos de cada acudiente */}
                  {kid.relations?.map((kidGuardian: IKidGuardian, idx) => (
                    <div key={idx} className="flex flex-wrap gap-x-2">
                      <div className="w-[40%]">
                        {capitalizeWords(kidGuardian.firstName)}{' '}
                        {capitalizeWords(kidGuardian.lastName as '')}
                      </div>
                      <div className="w-[20%]">
                        {
                          KID_RELATION_CODE_MAPPER[
                            kidGuardian.relation as KidGuardianRelationCodeEnum
                          ]
                        }
                      </div>
                      <div className="w-[30%]">
                        {kidGuardian.dialCodePhone} {kidGuardian.phone}
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </>
        )}
      </div>
    </Popup>
  );
};

export default ShowKidRegisteredModal;
