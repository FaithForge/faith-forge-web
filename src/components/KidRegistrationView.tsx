/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useDispatch, useSelector } from 'react-redux';

import { useRouter } from 'next/router';
import { PiUserSwitchFill } from 'react-icons/pi';

import {
  Button,
  Form,
  Input,
  NoticeBar,
  Radio,
  Image,
  Flex,
  Card,
  Cell,
  Typography,
  Skeleton,
  ImagePreview,
  Dialog,
} from 'react-vant';
import UpdateKidGuardianPhoneModal from './forms/UpdateKidGuardianPhone';
import { AiFillEdit } from 'react-icons/ai';
import { LiaBirthdayCakeSolid } from 'react-icons/lia';
import TagKidGroupApp from './TagKidGroupApp';
import {
  IKidGuardian,
  KidGroupType,
  UserGenderCode,
  USER_GENDER_CODE_MAPPER,
  KID_RELATION_CODE_MAPPER,
  KidGuardianRelationCodeEnum,
} from '@/libs/models';
import {
  AppDispatch,
  RootState,
  GetKid,
  GetKidGroups,
  CreateKidRegistration,
  RemoveKidRegistration,
  ReprintKidRegistration,
} from '@/libs/state/redux';
import { GetUserRoles, IsSupervisorRegisterKidChurch } from '@/libs/utils/auth';
import { FFDay } from '@/libs/utils/ffDay';
import { capitalizeWords } from '@/libs/utils/text';
import { toast } from 'sonner';

const KidRegistrationView = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [action, setAction] = useState<string>();
  const roles = GetUserRoles();
  const [openUpdateKidGuardianPhoneModal, setOpenUpdateKidGuardianPhoneModal] = useState(false);
  const [kidGuardianToUpdate, setKidGuardianToUpdate] = useState<IKidGuardian | undefined>();
  const kidGroupSlice = useSelector((state: RootState) => state.kidGroupSlice);
  const [isKidVolunteer, setIsKidVolunteer] = useState(false);

  const kidSlice = useSelector((state: RootState) => state.kidSlice);
  const kidRegistrationSlice = useSelector((state: RootState) => state.kidRegistrationSlice);

  const { current: churchMeeting } = useSelector((state: RootState) => state.churchMeetingSlice);

  useEffect(() => {
    if (kidSlice.current?.id) {
      dispatch(GetKid({ id: kidSlice.current.id }));
      dispatch(GetKidGroups({ type: KidGroupType.SPECIAL }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, kidSlice.current?.id]);

  const registerKid = async (values: any) => {
    setAction('register');
    const kidGuardianId = values.guardian;
    const observation = values.observations;

    if (kidSlice.current?.id && kidSlice.current.kidGroup?.id) {
      await dispatch(
        CreateKidRegistration({
          kidId: kidSlice.current.id,
          kidGroupId: isKidVolunteer ? kidGroupSlice.data[0].id : kidSlice.current.kidGroup?.id,
          kidGuardianId,
          observation,
        }),
      );
      toast.success('Se ha registrado al niño con exito', {
        duration: 1000,
        style: { color: 'white' },
      });
      router.back();
    }
  };

  const removeKidRegistration = async () => {
    setAction('remove');
    if (kidSlice.current?.currentKidRegistration?.id) {
      await dispatch(
        RemoveKidRegistration({
          id: kidSlice.current.currentKidRegistration.id,
        }),
      );
      toast.success('Se ha eliminado el registro del niño con exito', {
        duration: 1000,
        style: { color: 'white' },
      });
      router.back();
    }
  };

  const reprintRegisterLabelKid = async (copies: number) => {
    setAction('reprint');
    if (kidSlice.current?.currentKidRegistration?.id) {
      await dispatch(
        ReprintKidRegistration({
          id: kidSlice.current.currentKidRegistration.id,
          copies,
        }),
      );
      router.back();
    }
  };

  const kidGuardianRegistration = kidSlice.current?.relations?.length
    ? kidSlice.current?.relations?.find(
        (kidGuardian: IKidGuardian) =>
          kidGuardian.id === kidSlice.current?.currentKidRegistration?.guardianId,
      )
    : null;

  const birthday = kidSlice.current?.birthday
    ? FFDay(new Date(kidSlice.current.birthday)).tz('UTC').locale('es').format('MMMM D, YYYY')
    : '';

  const imageProfile = kidSlice.current?.photoUrl
    ? kidSlice.current.photoUrl
    : kidSlice.current?.gender === UserGenderCode.MALE
      ? '/icons/boy-v2.png'
      : '/icons/girl-v2.png';

  return (
    <div style={{ paddingLeft: 15, paddingRight: 15 }}>
      <Flex justify="center" align="center" gutter={16} style={{ paddingBottom: 10 }}>
        <Flex.Item span={8}>
          <Image
            alt="profileImage"
            src={imageProfile}
            fit="cover"
            radius={100}
            style={{ marginTop: 10, marginBottom: 10, borderRadius: '50%' }}
            onClick={() =>
              ImagePreview.open({
                closeable: true,
                showIndex: false,
                images: [imageProfile],
              })
            }
          />
        </Flex.Item>
        <Flex.Item span={16}>
          <h1
            style={{
              fontSize: 28,
              marginTop: 5,
              marginBottom: 0,
            }}
          >
            {capitalizeWords(kidSlice.current?.firstName ?? '')}
          </h1>
          <h2
            style={{
              fontSize: 20,
              marginTop: 0,
              marginBottom: 5,
            }}
          >
            {capitalizeWords(kidSlice.current?.lastName ?? '')}
          </h2>
          {!kidSlice.current?.kidGroup ? (
            <Skeleton row={1} rowWidth={120} rowHeight={25} style={{ padding: 0 }} />
          ) : (
            <>
              {kidSlice.current?.currentKidRegistration ? (
                <>
                  <TagKidGroupApp
                    kidGroup={
                      kidSlice.current?.currentKidRegistration.groupId !==
                      kidSlice.current.kidGroup.id
                        ? 'Yo Soy Iglekids'
                        : kidSlice.current.kidGroup.name
                    }
                    staticGroup={
                      kidSlice.current?.currentKidRegistration.groupId !==
                      kidSlice.current.kidGroup.id
                        ? false
                        : kidSlice.current.staticGroup
                    }
                  />
                </>
              ) : (
                <>
                  <TagKidGroupApp
                    kidGroup={
                      isKidVolunteer ? kidGroupSlice.data[0].name : kidSlice.current.kidGroup.name
                    }
                    staticGroup={isKidVolunteer ? false : kidSlice.current.staticGroup}
                  />
                  <PiUserSwitchFill
                    size={24}
                    style={{
                      paddingLeft: 10,
                      verticalAlign: 'bottom',
                    }}
                    onClick={() =>
                      Dialog.confirm({
                        confirmButtonText: 'Confirmar',
                        cancelButtonText: 'Cancelar',
                        title: `Cambiar niño a ${isKidVolunteer ? 'recibir en Iglekids' : 'Yo Soy Iglekids'}`,
                        message: `El niño sera cambiado ${isKidVolunteer ? 'para recibir en Iglekids' : 'al area de Yo Soy Iglekids'}. Por favor confirmar si desea realizar esta acción`,
                        onConfirm: () => setIsKidVolunteer(!isKidVolunteer),
                      })
                    }
                  />
                </>
              )}
            </>
          )}
        </Flex.Item>
      </Flex>
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
          <Flex gutter={16} wrap="wrap">
            {kidSlice.current?.faithForgeId && (
              <>
                <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                  Código de aplicación
                </Flex.Item>
                <Flex.Item span={12}>{kidSlice.current?.faithForgeId}</Flex.Item>
              </>
            )}
            {(kidSlice.current?.age || kidSlice.current?.age === 0) &&
              kidSlice.current?.ageInMonths && (
                <>
                  <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                    Edad
                  </Flex.Item>
                  <Flex.Item span={12}>
                    {`${Math.floor(kidSlice.current?.age ?? 0)} años y ${
                      kidSlice.current.ageInMonths - Math.floor(kidSlice.current.age) * 12
                    } meses`}
                  </Flex.Item>
                </>
              )}
            {kidSlice.current?.birthday && (
              <>
                <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                  Fecha de nacimiento
                </Flex.Item>
                <Flex.Item span={12}>{`${birthday}`}</Flex.Item>
              </>
            )}
            {kidSlice.current?.gender && (
              <>
                <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                  Género
                </Flex.Item>
                <Flex.Item span={12}>{`${
                  USER_GENDER_CODE_MAPPER[kidSlice.current.gender as any as UserGenderCode]
                }`}</Flex.Item>
              </>
            )}
            {kidSlice.loading && !kidSlice.current?.healthSecurityEntity ? (
              <Skeleton
                row={1}
                rowHeight={25}
                style={{ paddingLeft: 0, paddingBottom: 10, width: '100%' }}
              />
            ) : (
              kidSlice.current?.healthSecurityEntity && (
                <>
                  <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                    EPS
                  </Flex.Item>
                  <Flex.Item span={12}>{kidSlice.current.healthSecurityEntity}</Flex.Item>
                </>
              )
            )}
            {kidSlice.loading && !kidSlice.current?.medicalCondition ? (
              <Skeleton
                row={1}
                rowHeight={25}
                style={{ paddingLeft: 0, paddingBottom: 10, width: '100%' }}
              />
            ) : (
              kidSlice.current?.medicalCondition && (
                <>
                  <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                    Condición Medica
                  </Flex.Item>
                  <Flex.Item span={12}>
                    {`${kidSlice.current.medicalCondition?.code} - ${kidSlice.current.medicalCondition?.name}`}
                  </Flex.Item>
                </>
              )
            )}
            {kidSlice.loading && !kidSlice.current?.observations ? (
              <Skeleton
                row={1}
                rowHeight={25}
                style={{ paddingLeft: 0, paddingBottom: 10, width: '100%' }}
              />
            ) : (
              kidSlice.current?.observations && (
                <>
                  <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                    Observaciones generales
                  </Flex.Item>
                  <Flex.Item span={12}>{kidSlice.current.observations}</Flex.Item>
                </>
              )
            )}
          </Flex>
        </Card.Body>
      </Card>

      {!kidSlice.current?.currentKidRegistration ? (
        <Form
          form={form}
          layout="vertical"
          onFinish={registerKid}
          footer={
            <>
              <Typography.Text
                center={true}
                style={{ width: '100%', paddingTop: 5, paddingBottom: 5 }}
              >
                El registro sera para: {churchMeeting?.name}
              </Typography.Text>
              <Button
                loading={kidRegistrationSlice.loading && action === 'reprint'}
                loadingText="Registrando..."
                disabled={kidRegistrationSlice.loading}
                block
                nativeType="submit"
                type="primary"
                size="large"
                style={{ paddingTop: 5, paddingBottom: 5 }}
              >
                Registrar
              </Button>
            </>
          }
        >
          <Form.Item
            name="guardian"
            label="Seleccionar acudiente"
            rules={[
              {
                required: true,
                message: 'Por favor seleccione un acudiente',
              },
            ]}
          >
            {!kidSlice.current?.relations ? (
              <Skeleton row={3} style={{ width: '100%' }} />
            ) : (
              <Radio.Group value={form.getFieldValue('guardian')} style={{ width: '100%' }}>
                <Cell.Group border={false}>
                  {kidSlice.current.relations.map((kidGuardian: IKidGuardian) => {
                    return (
                      <Cell
                        key={kidGuardian.id}
                        clickable
                        title={`${capitalizeWords(kidGuardian.firstName)} ${capitalizeWords(
                          kidGuardian.lastName as '',
                        )} (${KID_RELATION_CODE_MAPPER[kidGuardian.relation]})`}
                        label={`Teléfono: ${kidGuardian.dialCodePhone} ${kidGuardian.phone}`}
                        onClick={() => form.setFieldValue('guardian', kidGuardian.id)}
                        icon={<Radio name={kidGuardian.id} />}
                        rightIcon={
                          <AiFillEdit
                            style={{ width: 24, height: 24 }}
                            onClick={() => {
                              const kidGuardianSearch = kidSlice.current?.relations?.find(
                                (item) => item.id === kidGuardian.id,
                              );
                              if (kidGuardianSearch) {
                                setKidGuardianToUpdate(kidGuardianSearch);
                                setOpenUpdateKidGuardianPhoneModal(true);
                              }
                            }}
                          />
                        }
                        style={{
                          paddingLeft: 0,
                          paddingRight: 0,
                          paddingTop: 5,
                          paddingBottom: 5,
                          alignItems: 'center',
                        }}
                      />
                    );
                  })}
                </Cell.Group>
              </Radio.Group>
            )}
          </Form.Item>

          <Form.Item name="observations" label="Observaciones al registrar">
            <Input.TextArea
              placeholder="Ejemplo: lleva bolso, lleva merienda, está enfermo de algo en el momento."
              maxLength={300}
              rows={2}
              showWordLimit
            />
          </Form.Item>
        </Form>
      ) : (
        <>
          <Card round style={{ backgroundColor: '#f9f9f9' }}>
            <Card.Header border>Información del registro</Card.Header>
            <Card.Body>
              <Flex gutter={16} wrap="wrap">
                <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                  Fecha de registro
                </Flex.Item>
                <Flex.Item span={12}>
                  {`${dayjs(kidSlice.current?.currentKidRegistration?.date.toString())
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
                {kidSlice.current?.currentKidRegistration?.observation && (
                  <>
                    <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                      Observaciones al registrar
                    </Flex.Item>
                    <Flex.Item span={12}>
                      {`${kidSlice.current.currentKidRegistration?.observation}`}
                    </Flex.Item>
                  </>
                )}
                {IsSupervisorRegisterKidChurch(roles) &&
                  kidSlice.current?.currentKidRegistration?.log && (
                    <>
                      <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                        Log de registro
                      </Flex.Item>
                      <Flex.Item span={12}>
                        {`${kidSlice.current.currentKidRegistration?.log}`}
                      </Flex.Item>
                    </>
                  )}
              </Flex>
            </Card.Body>
          </Card>
          <Card round style={{ backgroundColor: '#f9f9f9', marginTop: 10 }}>
            <Card.Header border>Acudientes</Card.Header>
            <Card.Body>
              <Flex gutter={8} wrap="wrap">
                <Flex.Item span={10} style={{ fontWeight: 'bold' }} key={'Nombre'}>
                  Nombre
                </Flex.Item>
                <Flex.Item span={5} style={{ fontWeight: 'bold' }} key={'Relación'}>
                  Relación
                </Flex.Item>
                <Flex.Item span={9} style={{ fontWeight: 'bold' }} key={'Teléfono'}>
                  Teléfono
                </Flex.Item>
                {kidSlice.current.relations?.map((kidGuardian: IKidGuardian) => {
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
          <div style={{ paddingTop: 10 }}>
            <Button
              loading={kidRegistrationSlice.loading && action === 'reprint'}
              loadingText="Reimprimiendo..."
              disabled={kidRegistrationSlice.loading}
              block
              type="primary"
              size="large"
              onClick={() => reprintRegisterLabelKid(2)}
            >
              Reimprimir registro
            </Button>
          </div>
          {IsSupervisorRegisterKidChurch(roles) && (
            <div style={{ paddingTop: 10, paddingBottom: 10 }}>
              <Button
                loading={kidRegistrationSlice.loading && action === 'remove'}
                loadingText="Eliminando registro..."
                disabled={kidRegistrationSlice.loading}
                block
                type="danger"
                size="large"
                onClick={() => removeKidRegistration()}
              >
                Eliminar Registro
              </Button>
            </div>
          )}
        </>
      )}
      {kidGuardianToUpdate && (
        <UpdateKidGuardianPhoneModal
          visible={openUpdateKidGuardianPhoneModal}
          onClose={(status: boolean) => setOpenUpdateKidGuardianPhoneModal(status)}
          kidGuardian={kidGuardianToUpdate}
        />
      )}
    </div>
  );
};

export default KidRegistrationView;
