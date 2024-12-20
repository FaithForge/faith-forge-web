import dayjs from 'dayjs';
import { Card, Flex, Image, NoticeBar, Popup, Tag } from 'react-vant';
import { FFDay } from '../utils/ffDay';
import {
  IKid,
  IKidGuardian,
  KID_RELATION_CODE_MAPPER,
  KidGuardianRelationCodeEnum,
  USER_GENDER_CODE_MAPPER,
  UserGenderCode,
} from '@faith-forge-web/models';
import { capitalizeWords } from '../utils/text';
import { LiaBirthdayCakeSolid } from 'react-icons/lia';
import { IsSupervisorRegisterKidChurch } from '../utils/auth';

type Props = {
  visible: boolean;
  onClose: (visible: boolean) => void;
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
        <Flex
          justify="center"
          align="center"
          gutter={16}
          style={{ paddingBottom: 10 }}
        >
          <Flex.Item span={8}>
            <Image
              alt="profileImage"
              src={
                kid.photoUrl
                  ? kid.photoUrl
                  : kid.gender === UserGenderCode.MALE
                    ? '/icons/boy-v2.png'
                    : '/icons/girl-v2.png'
              }
              fit="cover"
              radius={100}
              style={{ marginTop: 10, marginBottom: 10, borderRadius: '50%' }}
            />
          </Flex.Item>
          <Flex.Item span={16}>
            <h1
              style={{
                fontSize: 28,
                marginTop: 5,
                marginBottom: 5,
              }}
            >
              {capitalizeWords(kid.firstName ?? '')}
            </h1>
            <h2
              style={{
                fontSize: 20,
                marginTop: 0,
                marginBottom: 5,
              }}
            >
              {capitalizeWords(kid.lastName ?? '')}
            </h2>
            {kid.kidGroup && (
              <Tag type="primary" size="large" color="#94d3f8">
                {kid.kidGroup.name} {kid.staticGroup ? '(Estatico)' : ''}
              </Tag>
            )}
          </Flex.Item>
        </Flex>
        {birthday.slice(0, -6) ===
          dayjs(new Date()).locale('es').format('MMMM D') && (
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
            <Flex gutter={16} wrap="wrap">
              {kid.faithForgeId && (
                <>
                  <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                    Código de aplicación
                  </Flex.Item>
                  <Flex.Item span={12}>{kid.faithForgeId}</Flex.Item>
                </>
              )}
              {(kid.age || kid.age === 0) && kid.ageInMonths && (
                <>
                  <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                    Edad
                  </Flex.Item>
                  <Flex.Item span={12}>
                    {`${Math.floor(kid.age ?? 0)} años y ${
                      kid.ageInMonths - Math.floor(kid.age) * 12
                    } meses`}
                  </Flex.Item>
                </>
              )}
              {kid.birthday && (
                <>
                  <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                    Fecha de nacimiento
                  </Flex.Item>
                  <Flex.Item span={12}>{`${birthday}`}</Flex.Item>
                </>
              )}
              {kid.gender && (
                <>
                  <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                    Género
                  </Flex.Item>
                  <Flex.Item span={12}>{`${
                    USER_GENDER_CODE_MAPPER[kid.gender]
                  }`}</Flex.Item>
                </>
              )}
              {kid.healthSecurityEntity && (
                <>
                  <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                    EPS
                  </Flex.Item>
                  <Flex.Item span={12}>{kid.healthSecurityEntity}</Flex.Item>
                </>
              )}
              {kid.medicalCondition && (
                <>
                  <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                    Condición Medica
                  </Flex.Item>
                  <Flex.Item span={12}>
                    {`${kid.medicalCondition?.code} - ${kid.medicalCondition?.name}`}
                  </Flex.Item>
                </>
              )}
              {kid.observations && (
                <>
                  <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                    Observaciones generales
                  </Flex.Item>
                  <Flex.Item span={12}>{kid.observations}</Flex.Item>
                </>
              )}
            </Flex>
          </Card.Body>
        </Card>

        {kid.currentKidRegistration && (
          <>
            <Card round style={{ backgroundColor: '#f9f9f9' }}>
              <Card.Header border>Información del registro</Card.Header>
              <Card.Body>
                <Flex gutter={16} wrap="wrap">
                  <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                    Fecha de registro
                  </Flex.Item>
                  <Flex.Item span={12}>
                    {`${dayjs(kid.currentKidRegistration?.date.toString())
                      .locale('es')
                      .format('MMMM D, YYYY h:mm A')}`}
                  </Flex.Item>
                  {kidGuardianRegistration && (
                    <>
                      <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                        Acudiente que registro
                      </Flex.Item>
                      <Flex.Item span={12}>
                        {`${capitalizeWords(kidGuardianRegistration.firstName)} ${capitalizeWords(
                          kidGuardianRegistration.lastName as '',
                        )} (${KID_RELATION_CODE_MAPPER[kidGuardianRegistration.relation]}) - Teléfono: ${kidGuardianRegistration.dialCodePhone} ${
                          kidGuardianRegistration.phone
                        }`}
                      </Flex.Item>
                    </>
                  )}
                  {kid.currentKidRegistration?.observation && (
                    <>
                      <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                        Observaciones al registrar
                      </Flex.Item>
                      <Flex.Item span={12}>
                        {`${kid.currentKidRegistration?.observation}`}
                      </Flex.Item>
                    </>
                  )}
                  {IsSupervisorRegisterKidChurch() &&
                    kid.currentKidRegistration?.log && (
                      <>
                        <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                          Log de registro
                        </Flex.Item>
                        <Flex.Item span={12}>
                          {`${kid.currentKidRegistration?.log}`}
                        </Flex.Item>
                      </>
                    )}
                </Flex>
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
                <Flex gutter={8} wrap="wrap">
                  <Flex.Item span={10} style={{ fontWeight: 'bold' }}>
                    Nombre
                  </Flex.Item>
                  <Flex.Item span={5} style={{ fontWeight: 'bold' }}>
                    Relación
                  </Flex.Item>
                  <Flex.Item span={9} style={{ fontWeight: 'bold' }}>
                    Teléfono
                  </Flex.Item>
                  {kid.relations?.map((kidGuardian: IKidGuardian) => {
                    return (
                      <>
                        <Flex.Item span={10}>
                          {capitalizeWords(kidGuardian.firstName)}{' '}
                          {capitalizeWords(kidGuardian.lastName as '')}
                        </Flex.Item>
                        <Flex.Item span={5}>
                          {
                            KID_RELATION_CODE_MAPPER[
                              kidGuardian.relation as KidGuardianRelationCodeEnum
                            ]
                          }
                        </Flex.Item>
                        <Flex.Item span={9}>
                          {kidGuardian.dialCodePhone} {kidGuardian.phone}
                        </Flex.Item>
                      </>
                    );
                  })}
                </Flex>
              </Card.Body>
            </Card>
          </>
        )}
      </div>
    </Popup>
  );
};

export default ShowKidRegisteredModal;
