import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import NavBarApp from '../../components/NavBarApp';
import { MoreOutline } from 'antd-mobile-icons';
import {
  Space,
  Form,
  Button,
  TextArea,
  Image,
  AutoCenter,
  Grid,
  Radio,
  Popover,
  NoticeBar,
} from 'antd-mobile';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { capitalizeWords } from '../../utils/text';
import { USER_GENDER_CODE_MAPPER, UserGenderCode } from '../../models/User';
import {
  GetKid,
  RegisterKid,
  ReprintRegisterLabelKid,
  RestoreCreateKid,
} from '../../services/kidService';
import {
  KID_RELATION_CODE_MAPPER,
  KidGuardianRelationCode,
} from '../../models/KidGuardian';
import { useRouter } from 'next/router';
import { Action } from 'antd-mobile/es/components/popover';
import { EditOutlined, HomeOutlined, TeamOutlined } from '@ant-design/icons';
import CreateNewKidGuardian from '../../components/forms/CreateNewKidGuardian';
import { cleanCurrentKidGuardian } from '../../redux/slices/kidGuardianSlice';
import LoadingMask from '../../components/LoadingMask';

const RegisterKidView: NextPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [openKidGuardianModal, setOpenKidGuardianModal] = useState(false);
  const [kidId, setKidId] = useState('');
  const {
    current: kid,
    loading: kidLoading,
    error: kidError,
  } = useSelector((state: RootState) => state.kidSlice);
  const { current: churchMeeting } = useSelector(
    (state: RootState) => state.churchMeetingSlice,
  );
  const actions: Action[] = [
    {
      key: 'updateKid',
      icon: <EditOutlined />,
      text: 'Actualizar datos del niño',
      onClick: () => {
        router.push('/registration/updateKid');
      },
    },
    {
      key: 'addNewKidGuardian',
      icon: <TeamOutlined />,
      text: 'Asignar nuevo acudiente',
      onClick: () => {
        dispatch(cleanCurrentKidGuardian());
        setOpenKidGuardianModal(true);
      },
    },
  ];

  const right = (
    <div style={{ fontSize: 24 }}>
      <Space style={{ '--gap': '16px' }}>
        <Popover.Menu
          actions={actions}
          placement="bottom-start"
          trigger="click"
          onAction={(node) => node.onClick}
        >
          <MoreOutline />
        </Popover.Menu>
      </Space>
    </div>
  );

  useEffect(() => {
    if (kid?.id) {
      setKidId(kid.id);
      dispatch(GetKid({ id: kid.id }));
    }
  }, [dispatch, kid?.id]);

  const registerKid = async (values: any) => {
    const guardianId = values.guardian;
    const observation = values.observations;

    if (kid?.id) {
      await dispatch(RegisterKid({ kidId: kid.id, guardianId, observation }));
      router.back();
    }
  };

  const restoreCreateKid = async () => {
    if (kidId) {
      await dispatch(RestoreCreateKid({ id: kidId }));
      router.back();
    }
  };

  const reprintRegisterLabelKid = async (copies: number) => {
    if (kid?.id) {
      await dispatch(ReprintRegisterLabelKid({ kidId: kid.id, copies }));
      router.back();
    }
  };

  const guardianOptions = kid?.relations
    ? kid.relations.map((relation: any) => {
        return {
          label: `${capitalizeWords(relation.firstName)} ${capitalizeWords(
            relation.lastName as '',
          )} (${
            KID_RELATION_CODE_MAPPER[
              relation.relation as KidGuardianRelationCode
            ]
          }) - Teléfono: ${relation.phone}`,
          value: relation.guardianId,
        };
      })
    : [];

  const birthday = kid?.birthday
    ? dayjs(kid.birthday.toString()).locale('es').format('MMMM D, YYYY')
    : '';
  const guardianRegistration = kid?.isRegistered
    ? guardianOptions?.find((item) => item.value === kid.registry.guardian.id)
    : null;

  return (
    <>
      {kidLoading ? <LoadingMask /> : ''}
      <NavBarApp right={right} title="Registrar niño" />
      <AutoCenter>
        <Image
          alt="profileImage"
          src={
            kid?.photoUrl
              ? kid?.photoUrl
              : kid?.gender === UserGenderCode.MALE
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
          {capitalizeWords(kid?.firstName ?? '')}
        </h1>
        <h2
          style={{
            textAlign: 'center',
            fontSize: 22,
            marginTop: 0,
            marginBottom: 5,
          }}
        >
          {capitalizeWords(kid?.lastName ?? '')}
        </h2>
        <p>
          <b>Código de aplicación:</b> {kid?.faithForgeId}
        </p>
      </AutoCenter>
      <div style={{ fontSize: 16 }}>
        {kid?.age && kid?.ageInMonths && (
          <Grid
            columns={2}
            gap={8}
            style={{ paddingBottom: 10, border: '1px' }}
          >
            <Grid.Item style={{ fontWeight: 'bold' }}>Edad</Grid.Item>
            <Grid.Item>
              {`${Math.floor(kid?.age ?? 0)} años y ${
                kid.ageInMonths - Math.floor(kid.age) * 12
              } meses`}
            </Grid.Item>
          </Grid>
        )}
        {kid?.birthday && (
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
        {kid?.gender && (
          <Grid
            columns={2}
            gap={8}
            style={{ paddingBottom: 10, border: '1px' }}
          >
            <Grid.Item style={{ fontWeight: 'bold' }}>Género</Grid.Item>
            <Grid.Item>{`${
              USER_GENDER_CODE_MAPPER[kid.gender as any as UserGenderCode]
            }`}</Grid.Item>
          </Grid>
        )}
        {kid?.healthSecurityEntity && (
          <Grid
            columns={2}
            gap={8}
            style={{ paddingBottom: 10, border: '1px' }}
          >
            <Grid.Item style={{ fontWeight: 'bold' }}>EPS</Grid.Item>
            <Grid.Item>{kid.healthSecurityEntity}</Grid.Item>
          </Grid>
        )}
        {kid?.isRegistered && (
          <>
            <Grid
              columns={2}
              gap={8}
              style={{ paddingBottom: 10, border: '1px' }}
            >
              <Grid.Item style={{ fontWeight: 'bold' }}>
                Fecha de registro
              </Grid.Item>
              <Grid.Item>{`${dayjs(kid.registry?.registrationDate.toString())
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
              <Grid.Item>{`${guardianRegistration?.label}`}</Grid.Item>
            </Grid>
            {kid.registry?.observation && (
              <Grid
                columns={2}
                gap={8}
                style={{ paddingBottom: 10, border: '1px' }}
              >
                <Grid.Item style={{ fontWeight: 'bold' }}>
                  Observaciones al registrar
                </Grid.Item>
                <Grid.Item>{`${kid.registry?.observation}`}</Grid.Item>
              </Grid>
            )}
          </>
        )}
        {kid?.medicalCondition && (
          <Grid
            columns={2}
            gap={8}
            style={{ paddingBottom: 10, border: '1px' }}
          >
            <Grid.Item style={{ fontWeight: 'bold' }}>
              Condición Medica
            </Grid.Item>
            <Grid.Item>{`${kid.medicalCondition?.code} - ${kid.medicalCondition?.name}`}</Grid.Item>
          </Grid>
        )}
        {kid?.observations && (
          <Grid
            columns={2}
            gap={8}
            style={{ paddingBottom: 10, border: '1px' }}
          >
            <Grid.Item style={{ fontWeight: 'bold' }}>
              Observaciones generales
            </Grid.Item>
            <Grid.Item>{kid.observations}</Grid.Item>
          </Grid>
        )}
        {kid?.group && (
          <Grid
            columns={2}
            gap={8}
            style={{ paddingBottom: 10, border: '1px' }}
          >
            <Grid.Item style={{ fontWeight: 'bold' }}>Salón</Grid.Item>
            <Grid.Item>
              {kid.group} {kid.staticGroup ? '(Estatico)' : ''}
            </Grid.Item>
          </Grid>
        )}
      </div>
      {!kid?.isRegistered ? (
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
                {guardianOptions.map((guardian) => {
                  return (
                    <Radio
                      style={{
                        '--icon-size': '18px',
                        '--font-size': '14px',
                        '--gap': '6px',
                      }}
                      key={guardian.value}
                      value={guardian.value}
                    >
                      {guardian.label}
                    </Radio>
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
              Reimprimir registro completo (2)
            </Button>
          </div>
          <div style={{ paddingTop: 10 }}>
            <Button
              block
              color="primary"
              size="large"
              onClick={() => reprintRegisterLabelKid(1)}
            >
              Reimprimir registro parcial (1)
            </Button>
          </div>
        </>
      )}
      {kidError && (
        <>
          <p>
            El niño no fue bien guardado, oprima este botón para restaurarlo.
            Luego de esto, debe editarlo en caso que requiera campos adicionales
            como observaciones o enfermedades. Adicional debe asignar un
            acudiente para registrarlo.
          </p>
          <p>
            Al oprimir se devolverá a la página anterior y debe buscarlo
            nuevamente
          </p>
          <Button
            block
            color="primary"
            size="large"
            onClick={() => restoreCreateKid()}
          >
            Restaurar creación de niño niño
          </Button>
        </>
      )}
      <CreateNewKidGuardian
        visible={openKidGuardianModal}
        onClose={(status: boolean) => setOpenKidGuardianModal(status)}
      />
    </>
  );
};

export default RegisterKidView;
