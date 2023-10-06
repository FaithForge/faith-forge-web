import React, { useEffect } from 'react';
import type { NextPage } from 'next';
import NavBarApp from '../../components/NavBarApp';
import { SearchOutline, MoreOutline } from 'antd-mobile-icons';
import {
  Space,
  Form,
  Button,
  TextArea,
  Image,
  AutoCenter,
  Grid,
  Radio,
} from 'antd-mobile';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { capitalizeWords } from '../../utils/text';
import { USER_GENDER_CODE_MAPPER, UserGenderCode } from '../../models/Uset';
import { GetKid, RegisterKid } from '../../services/kidService';
import {
  KID_RELATION_CODE_MAPPER,
  KidGuardianRelationCode,
} from '../../models/KidGuardian';
import { useRouter } from 'next/router';

const RegisterKidView: NextPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { current: kid } = useSelector((state: RootState) => state.kidSlice);
  const right = (
    <div style={{ fontSize: 24 }}>
      <Space style={{ '--gap': '16px' }}>
        <SearchOutline />
        <MoreOutline />
      </Space>
    </div>
  );

  useEffect(() => {
    if (kid?.id) {
      dispatch(GetKid({ id: kid?.id }));
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

  const guardianOptions = kid?.relations
    ? kid.relations.map((relation: any) => {
        return {
          label: `${capitalizeWords(relation.firstName)} ${capitalizeWords(
            relation.lastName as '',
          )} (${
            KID_RELATION_CODE_MAPPER[
              relation.relation as KidGuardianRelationCode
            ]
          }) - Telefono: ${relation.phone}`,
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
          width={160}
          height={160}
          fit="cover"
          style={{ borderRadius: '50%' }}
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
          <b>Codigo de aplicación:</b> {kid?.faithForgeId}
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
              Fecha de cumpleaños
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
            <Grid.Item style={{ fontWeight: 'bold' }}>Genero</Grid.Item>
            <Grid.Item>{`${
              USER_GENDER_CODE_MAPPER[kid.gender as any as UserGenderCode]
            }`}</Grid.Item>
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
            <Grid.Item>{kid.medicalCondition}</Grid.Item>
          </Grid>
        )}
      </div>
      {!kid?.isRegistered ? (
        <Form
          layout="vertical"
          onFinish={registerKid}
          footer={
            <Button block type="submit" color="primary" size="large">
              Guardar
            </Button>
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

          <Form.Item name="observations" label="Observaciones">
            <TextArea
              placeholder="Ejemplo: lleva bolso, lleva merienda, esta enfermo de algo en el momento."
              maxLength={300}
              rows={3}
              showCount
            />
          </Form.Item>
        </Form>
      ) : (
        <>
          <div style={{ paddingTop: 10 }}>
            <Button block color="primary" size="large">
              Reimprimir registro completo
            </Button>
          </div>
          <div style={{ paddingTop: 10 }}>
            <Button block color="primary" size="large">
              Reimprimir registro parcial
            </Button>
          </div>
        </>
      )}
    </>
  );
};

export default RegisterKidView;
