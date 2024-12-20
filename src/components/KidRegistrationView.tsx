import React, { useEffect, useState } from 'react';
import {
  Space,
  Form,
  Button,
  TextArea,
  Image,
  AutoCenter,
  Grid,
  Radio,
  NoticeBar,
  Toast,
} from 'antd-mobile';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { capitalizeWords } from '../utils/text';
import { USER_GENDER_CODE_MAPPER, UserGenderCode } from '../models/User';
import { HomeOutlined, EditFilled, GiftOutlined } from '@ant-design/icons';

import { IKidGuardian, KID_RELATION_CODE_MAPPER } from '@/models/KidChurch';
import { IsSupervisorRegisterKidChurch } from '@/utils/auth';
import UpdateKidGuardianPhoneModal from '@/components/forms/UpdateKidGuardianPhone';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import LoadingMask from './LoadingMask';
import { FFDay } from '@/utils/ffDay';
import {
  CreateKidRegistration,
  RemoveKidRegistration,
  ReprintKidRegistration,
} from '@/redux/thunks/kid-church/kid-registration.thunk';
import { useRouter } from 'next/router';
import { GetKid } from '@/redux/thunks/kid-church/kid.thunk';

const KidRegistrationView = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
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
  }, [dispatch, kidSlice.current?.id]);

  const registerKid = async (values: any) => {
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
      Toast.show({
        content: 'Se ha registrado al niño con exito',
        position: 'bottom',
        duration: 3000,
      });
      router.back();
    }
  };

  const removeKidRegistration = async () => {
    if (kidSlice.current?.currentKidRegistration?.id) {
      await dispatch(
        RemoveKidRegistration({
          id: kidSlice.current.currentKidRegistration.id,
        }),
      );

      Toast.show({
        content: 'Se ha eliminado el registro del niño con exito',
        position: 'bottom',
        duration: 3000,
      });
      router.back();
    }
  };

  const reprintRegisterLabelKid = async (copies: number) => {
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

  const kidGuardianOptions = kidSlice.current?.relations
    ? kidSlice.current.relations.map((relation: IKidGuardian) => {
        return {
          label: `${capitalizeWords(relation.firstName)} ${capitalizeWords(
            relation.lastName as '',
          )} (${KID_RELATION_CODE_MAPPER[relation.relation]}) - Teléfono: ${
            relation.phone
          }`,
          value: relation.id,
        };
      })
    : [];

  const kidGuardianRegistration = kidGuardianOptions?.length
    ? kidGuardianOptions?.find(
        (item) =>
          item.value === kidSlice.current?.currentKidRegistration?.guardianId,
      )
    : null;

  const birthday = kidSlice.current?.birthday
    ? FFDay(new Date(kidSlice.current.birthday))
        .tz('UTC')
        .locale('es')
        .format('MMMM D, YYYY')
    : '';

  return (
    <>
      {kidSlice.loading || kidRegistrationSlice.loading ? <LoadingMask /> : ''}
      <AutoCenter>
        <Image
          alt="profileImage"
          src={
            kidSlice.current?.photoUrl
              ? kidSlice.current?.photoUrl
              : kidSlice.current?.gender === UserGenderCode.MALE
              ? '/icons/boy.png'
              : '/icons/girl.png'
          }
          width={180}
          height={180}
          fit="cover"
          style={{ marginTop: 10, marginBottom: 10, borderRadius: '50%' }}
        />
        <h1
          style={{
            textAlign: 'center',
            fontSize: 32,
            marginTop: 5,
            marginBottom: 5,
          }}
        >
          {capitalizeWords(kidSlice.current?.firstName ?? '')}
        </h1>
        <h2
          style={{
            textAlign: 'center',
            fontSize: 22,
            marginTop: 0,
            marginBottom: 5,
          }}
        >
          {capitalizeWords(kidSlice.current?.lastName ?? '')}
        </h2>
        <p>
          <b>Código de aplicación:</b> {kidSlice.current?.faithForgeId}
        </p>
      </AutoCenter>
      {birthday.slice(0, -6) ===
        dayjs(new Date()).locale('es').format('MMMM D') && (
        <NoticeBar
          content="¡¡¡HOY ES SU CUMPLEAÑOS!!!"
          color="info"
          icon={<GiftOutlined />}
          style={{ marginBottom: '10px' }}
        />
      )}
      <div style={{ fontSize: 16 }}>
        {(kidSlice.current?.age || kidSlice.current?.age === 0) &&
          kidSlice.current?.ageInMonths && (
            <Grid
              columns={2}
              gap={8}
              style={{ paddingBottom: 10, border: '1px' }}
            >
              <Grid.Item style={{ fontWeight: 'bold' }}>Edad</Grid.Item>
              <Grid.Item>
                {`${Math.floor(kidSlice.current?.age ?? 0)} años y ${
                  kidSlice.current.ageInMonths -
                  Math.floor(kidSlice.current.age) * 12
                } meses`}
              </Grid.Item>
            </Grid>
          )}
        {kidSlice.current?.birthday && (
          <Grid
            columns={2}
            gap={8}
            style={{ paddingBottom: 10, border: '1px' }}
          >
            <Grid.Item style={{ fontWeight: 'bold' }}>
              Fecha de nacimiento
            </Grid.Item>
            <Grid.Item>{`${birthday}`}</Grid.Item>
          </Grid>
        )}
        {kidSlice.current?.gender && (
          <Grid
            columns={2}
            gap={8}
            style={{ paddingBottom: 10, border: '1px' }}
          >
            <Grid.Item style={{ fontWeight: 'bold' }}>Género</Grid.Item>
            <Grid.Item>{`${
              USER_GENDER_CODE_MAPPER[
                kidSlice.current.gender as any as UserGenderCode
              ]
            }`}</Grid.Item>
          </Grid>
        )}
        {kidSlice.current?.healthSecurityEntity && (
          <Grid
            columns={2}
            gap={8}
            style={{ paddingBottom: 10, border: '1px' }}
          >
            <Grid.Item style={{ fontWeight: 'bold' }}>EPS</Grid.Item>
            <Grid.Item>{kidSlice.current.healthSecurityEntity}</Grid.Item>
          </Grid>
        )}
        {kidSlice.current?.currentKidRegistration && (
          <>
            <Grid
              columns={2}
              gap={8}
              style={{ paddingBottom: 10, border: '1px' }}
            >
              <Grid.Item style={{ fontWeight: 'bold' }}>
                Fecha de registro
              </Grid.Item>
              <Grid.Item>{`${dayjs(
                kidSlice.current.currentKidRegistration?.date.toString(),
              )
                .locale('es')
                .format('MMMM D, YYYY h:mm A')}`}</Grid.Item>
            </Grid>
            <Grid
              columns={2}
              gap={8}
              style={{ paddingBottom: 10, border: '1px' }}
            >
              <Grid.Item style={{ fontWeight: 'bold' }}>
                Acudiente que registro
              </Grid.Item>
              <Grid.Item>{`${kidGuardianRegistration?.label}`}</Grid.Item>
            </Grid>
            {IsSupervisorRegisterKidChurch() &&
              kidSlice.current.currentKidRegistration?.log && (
                <Grid
                  columns={2}
                  gap={8}
                  style={{ paddingBottom: 10, border: '1px' }}
                >
                  <Grid.Item style={{ fontWeight: 'bold' }}>
                    Log de registro
                  </Grid.Item>
                  <Grid.Item>{`${kidSlice.current.currentKidRegistration?.log}`}</Grid.Item>
                </Grid>
              )}
            {kidSlice.current.currentKidRegistration?.observation && (
              <Grid
                columns={2}
                gap={8}
                style={{ paddingBottom: 10, border: '1px' }}
              >
                <Grid.Item style={{ fontWeight: 'bold' }}>
                  Observaciones al registrar
                </Grid.Item>
                <Grid.Item>{`${kidSlice.current.currentKidRegistration?.observation}`}</Grid.Item>
              </Grid>
            )}
          </>
        )}
        {kidSlice.current?.medicalCondition && (
          <Grid
            columns={2}
            gap={8}
            style={{ paddingBottom: 10, border: '1px' }}
          >
            <Grid.Item style={{ fontWeight: 'bold' }}>
              Condición Medica
            </Grid.Item>
            <Grid.Item>{`${kidSlice.current.medicalCondition?.code} - ${kidSlice.current.medicalCondition?.name}`}</Grid.Item>
          </Grid>
        )}
        {kidSlice.current?.observations && (
          <Grid
            columns={2}
            gap={8}
            style={{ paddingBottom: 10, border: '1px' }}
          >
            <Grid.Item style={{ fontWeight: 'bold' }}>
              Observaciones generales
            </Grid.Item>
            <Grid.Item>{kidSlice.current.observations}</Grid.Item>
          </Grid>
        )}
        {kidSlice.current?.kidGroup && (
          <Grid
            columns={2}
            gap={8}
            style={{ paddingBottom: 10, border: '1px' }}
          >
            <Grid.Item style={{ fontWeight: 'bold' }}>Salón</Grid.Item>
            <Grid.Item>
              {kidSlice.current.kidGroup.name}{' '}
              {kidSlice.current.staticGroup ? '(Estatico)' : ''}
            </Grid.Item>
          </Grid>
        )}
      </div>
      {!kidSlice.current?.currentKidRegistration ? (
        <Form
          layout="vertical"
          onFinish={registerKid}
          footer={
            <>
              <NoticeBar
                style={{
                  '--height': '20px',
                }}
                icon={<HomeOutlined />}
                content={`Servicio: ${churchMeeting?.name}`}
                color="info"
              />
              <Button block type="submit" color="primary" size="large">
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
            <Radio.Group defaultValue="1">
              <Space direction="vertical">
                {kidGuardianOptions.map((kidGuardian) => {
                  return (
                    <div
                      key={kidGuardian.value}
                      style={{
                        display: 'flex',
                        gap: '5px',
                      }}
                    >
                      <Radio
                        style={{
                          '--icon-size': '18px',
                          '--font-size': '14px',
                          '--gap': '6px',
                        }}
                        key={kidGuardian.value}
                        value={kidGuardian.value}
                      >
                        {kidGuardian.label}
                      </Radio>{' '}
                      <EditFilled
                        style={{ fontSize: 18 }}
                        onClick={() => {
                          const kidGuardianSearch =
                            kidSlice.current?.relations?.find(
                              (item) => item.id === kidGuardian.value,
                            );
                          if (kidGuardianSearch) {
                            setKidGuardianToUpdate(kidGuardianSearch);
                            setOpenUpdateKidGuardianPhoneModal(true);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="observations" label="Observaciones al registrar">
            <TextArea
              placeholder="Ejemplo: lleva bolso, lleva merienda, está enfermo de algo en el momento."
              maxLength={300}
              rows={3}
              showCount
            />
          </Form.Item>
        </Form>
      ) : (
        <>
          <div style={{ paddingTop: 10 }}>
            <Button
              block
              color="primary"
              size="large"
              onClick={() => reprintRegisterLabelKid(2)}
            >
              Reimprimir registro
            </Button>
          </div>
          {IsSupervisorRegisterKidChurch() && (
            <div style={{ paddingTop: 10 }}>
              <Button
                block
                color="danger"
                size="large"
                onClick={() => removeKidRegistration()}
              >
                Eliminar Registro
              </Button>
            </div>
          )}

          <h2
            style={{
              textAlign: 'center',
              fontSize: 22,
              marginTop: 25,
              marginBottom: 5,
            }}
          >
            Acudientes
          </h2>
          <table
            width={'100%'}
            style={{
              marginTop: '5px',
              marginBottom: '10px',
              border: '1px solid black',
            }}
          >
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Relación</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {kidSlice.current.relations?.map((kidGuardian) => {
                return (
                  <tr key={kidGuardian.id}>
                    <td>
                      {capitalizeWords(kidGuardian.firstName)}{' '}
                      {capitalizeWords(kidGuardian.lastName as '')}
                    </td>
                    <td>{KID_RELATION_CODE_MAPPER[kidGuardian.relation]}</td>
                    <td>{kidGuardian.phone}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
    </>
  );
};

export default KidRegistrationView;
