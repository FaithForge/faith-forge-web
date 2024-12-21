/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { capitalizeWords } from '../utils/text';
import { useDispatch, useSelector } from 'react-redux';

import { useRouter } from 'next/router';

import {
  Button,
  Form,
  Input,
  NoticeBar,
  Radio,
  Image,
  Flex,
  Tag,
  Card,
  Cell,
  Typography,
  Notify,
  Skeleton,
  ImagePreview,
} from 'react-vant';
import { IsSupervisorRegisterKidChurch } from '../utils/auth';
import { FFDay } from '../utils/ffDay';
import UpdateKidGuardianPhoneModal from './forms/UpdateKidGuardianPhone';
import {
  AppDispatch,
  CreateKidRegistration,
  GetKid,
  RemoveKidRegistration,
  ReprintKidRegistration,
  RootState,
} from '@faith-forge-web/state/redux';
import {
  IKidGuardian,
  KID_RELATION_CODE_MAPPER,
  KidGuardianRelationCodeEnum,
  USER_GENDER_CODE_MAPPER,
  UserGenderCode,
} from '@faith-forge-web/models';
import { AiFillEdit } from 'react-icons/ai';
import { LiaBirthdayCakeSolid } from 'react-icons/lia';

const KidRegistrationView = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [action, setAction] = useState<string>();
  const [openUpdateKidGuardianPhoneModal, setOpenUpdateKidGuardianPhoneModal] =
    useState(false);
  const [kidGuardianToUpdate, setKidGuardianToUpdate] = useState<
    IKidGuardian | undefined
  >();

  const kidSlice = useSelector((state: RootState) => state.kidSlice);
  const kidRegistrationSlice = useSelector(
    (state: RootState) => state.kidRegistrationSlice,
  );

  const { current: churchMeeting } = useSelector(
    (state: RootState) => state.churchMeetingSlice,
  );

  useEffect(() => {
    if (kidSlice.current?.id) {
      dispatch(GetKid({ id: kidSlice.current.id }));
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
          kidGroupId: kidSlice.current.kidGroup?.id,
          kidGuardianId,
          observation,
        }),
      );
      Notify.show({
        message: 'Se ha registrado al niño con exito',
        type: 'success',
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

      Notify.show({
        type: 'success',
        message: 'Se ha eliminado el registro del niño con exito',
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
          kidGuardian.id ===
          kidSlice.current?.currentKidRegistration?.guardianId,
      )
    : null;

  const birthday = kidSlice.current?.birthday
    ? FFDay(new Date(kidSlice.current.birthday))
        .tz('UTC')
        .locale('es')
        .format('MMMM D, YYYY')
    : '';

  const imageProfile = kidSlice.current?.photoUrl
    ? kidSlice.current.photoUrl
    : kidSlice.current?.gender === UserGenderCode.MALE
      ? '/icons/boy-v2.png'
      : '/icons/girl-v2.png';

  return (
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
            src={imageProfile}
            fit="cover"
            radius={100}
            style={{ marginTop: 10, marginBottom: 10, borderRadius: '50%' }}
            onClick={() =>
              ImagePreview.open({
                closeable: true,
                showIndex: false,
                images: [imageProfile],
                onChange: (index) => console.log(`当前展示第${index + 1}张`),
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
            <Skeleton
              row={1}
              rowWidth={120}
              rowHeight={25}
              style={{ padding: 0 }}
            />
          ) : (
            <Tag type="primary" size="large" color="#94d3f8">
              {kidSlice.current.kidGroup.name}{' '}
              {kidSlice.current.staticGroup ? '(Estatico)' : ''}
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
            {kidSlice.current?.faithForgeId && (
              <>
                <Flex.Item span={12} style={{ fontWeight: 'bold' }}>
                  Código de aplicación
                </Flex.Item>
                <Flex.Item span={12}>
                  {kidSlice.current?.faithForgeId}
                </Flex.Item>
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
                      kidSlice.current.ageInMonths -
                      Math.floor(kidSlice.current.age) * 12
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
                  USER_GENDER_CODE_MAPPER[
                    kidSlice.current.gender as any as UserGenderCode
                  ]
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
                  <Flex.Item span={12}>
                    {kidSlice.current.healthSecurityEntity}
                  </Flex.Item>
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
                  <Flex.Item span={12}>
                    {kidSlice.current.observations}
                  </Flex.Item>
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
              <Radio.Group
                value={form.getFieldValue('guardian')}
                style={{ width: '100%' }}
              >
                <Cell.Group border={false}>
                  {kidSlice.current.relations.map(
                    (kidGuardian: IKidGuardian) => {
                      return (
                        <Cell
                          key={kidGuardian.id}
                          clickable
                          title={`${capitalizeWords(kidGuardian.firstName)} ${capitalizeWords(
                            kidGuardian.lastName as '',
                          )} (${KID_RELATION_CODE_MAPPER[kidGuardian.relation]})`}
                          label={`Teléfono: ${kidGuardian.dialCodePhone} ${kidGuardian.phone}`}
                          onClick={() =>
                            form.setFieldValue('guardian', kidGuardian.id)
                          }
                          icon={<Radio name={kidGuardian.id} />}
                          rightIcon={
                            <AiFillEdit
                              style={{ width: 24, height: 24 }}
                              onClick={() => {
                                const kidGuardianSearch =
                                  kidSlice.current?.relations?.find(
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
                    },
                  )}
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
                  {`${dayjs(
                    kidSlice.current?.currentKidRegistration?.date.toString(),
                  )
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
                {IsSupervisorRegisterKidChurch() &&
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
                <Flex.Item
                  span={12}
                  style={{ fontWeight: 'bold' }}
                  key={'Nombre'}
                >
                  Nombre
                </Flex.Item>
                <Flex.Item
                  span={5}
                  style={{ fontWeight: 'bold' }}
                  key={'Relación'}
                >
                  Relación
                </Flex.Item>
                <Flex.Item
                  span={7}
                  style={{ fontWeight: 'bold' }}
                  key={'naTeléfonome'}
                >
                  Teléfono
                </Flex.Item>
                {kidSlice.current.relations?.map(
                  (kidGuardian: IKidGuardian) => {
                    return (
                      <>
                        <Flex.Item span={12}>
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
                        <Flex.Item span={7}>
                          {kidGuardian.dialCodePhone} {kidGuardian.phone}
                        </Flex.Item>
                      </>
                    );
                  },
                )}
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
          {IsSupervisorRegisterKidChurch() && (
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
          onClose={(status: boolean) =>
            setOpenUpdateKidGuardianPhoneModal(status)
          }
          kidGuardian={kidGuardianToUpdate}
        />
      )}
    </div>
  );
};

export default KidRegistrationView;
