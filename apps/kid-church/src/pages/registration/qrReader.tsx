/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import NavBarApp from '../../components/NavBarApp';
import { useDispatch, useSelector } from 'react-redux';
import LoadingMask from '../../components/LoadingMask';
import { IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Collapse, Form, Input, Space, Steps, Toast } from 'react-vant';
import { capitalizeWords } from '../../utils/text';
import { Layout } from '../../components/Layout';
import {
  RootState,
  AppDispatch,
  cleanScanQRSearch,
  CreateKidRegistration,
  ScanCodeKidRegistration,
} from '@faith-forge-web/state/redux';
import { PopoverApp, PopoverAppAction } from '../../components/PopoverApp';
import { HiDotsVertical } from 'react-icons/hi';
import { AiOutlineQrcode } from 'react-icons/ai';

const QRReader: NextPage = () => {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const scanQRKidGuardianSlice = useSelector(
    (state: RootState) => state.scanQRKidGuardianSlice,
  );
  const [relationsToRegister, setRelationsToRegister] = useState(
    scanQRKidGuardianSlice.relations,
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [relationSelectToRegister, setRelationSelectToRegister] = useState<
    string[]
  >([]);
  const router = useRouter();

  const titleNavBar = 'Registro por QR';
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();

  useEffect(() => {
    return () => {
      dispatch(cleanScanQRSearch());
    };
  }, []);

  const handleReadCode = (targets: IDetectedBarcode[]) => {
    const code = targets[0].rawValue;

    if (!code) {
      Toast.fail({
        message: 'Código Invalido',
        position: 'bottom',
        duration: 3000,
      });
    } else {
      dispatch(ScanCodeKidRegistration(code));
    }
  };

  const confirmKidToRegister = () => {
    if (!relationSelectToRegister.length) {
      Toast.fail({
        message: `Seleccione al menos un niño`,
        position: 'middle',
        duration: 3000,
      });
      return;
    }
    setRelationsToRegister(
      relationsToRegister.filter((relationToRegister) =>
        relationSelectToRegister.includes(relationToRegister.id),
      ),
    );
    setStep(2);
  };

  const onRegisterKids = async (values: any) => {
    for (const relationToRegister of relationsToRegister) {
      if (relationToRegister?.id && relationToRegister.kidGroup?.id) {
        await dispatch(
          CreateKidRegistration({
            kidId: relationToRegister.id,
            kidGroupId: relationToRegister.kidGroup?.id,
            kidGuardianId: scanQRKidGuardianSlice.kidGuardian.id,
            observation: values
              ? values[`observations-${relationToRegister.id}`]
              : undefined,
          }),
        );
        Toast.info({
          message: 'Se ha registrado al niño con exito',
          position: 'bottom',
          duration: 3000,
        });
      }
    }
    Toast.info({
      message: 'Se ha registrado con exito a todos los niños',
      position: 'bottom',
      duration: 3000,
    });
    router.back();
  };

  useEffect(() => {
    dispatch(cleanScanQRSearch());
  }, [dispatch, pathname]);

  useEffect(() => {
    if (scanQRKidGuardianSlice.error) {
      Toast.fail({
        message: scanQRKidGuardianSlice.error,
        position: 'bottom',
        duration: 3000,
      });
    }
  }, [dispatch, scanQRKidGuardianSlice.error]);

  useEffect(() => {
    if (
      scanQRKidGuardianSlice.kidGuardian &&
      scanQRKidGuardianSlice.relations
    ) {
      setStep(1);
      setRelationsToRegister(scanQRKidGuardianSlice.relations);
    }
  }, [
    dispatch,
    scanQRKidGuardianSlice.kidGuardian,
    scanQRKidGuardianSlice.relations,
  ]);

  const actions: PopoverAppAction[] = [
    {
      key: 'updateKid',
      icon: <AiOutlineQrcode />,
      text: 'Generar QR Acudiente',
      onClick: () => {
        router.push('/registration/generateQRKidGuardian');
      },
    },
  ];

  return (
    <Layout>
      {scanQRKidGuardianSlice.loading ? <LoadingMask /> : ''}
      <NavBarApp
        title={titleNavBar}
        right={
          <PopoverApp
            actions={actions}
            icon={<HiDotsVertical size={'1.5em'} />}
          />
        }
      />
      <Steps active={step}>
        <Steps.Item>Escanear Codigo</Steps.Item>
        <Steps.Item>Escoger Niños a Registrar</Steps.Item>
        <Steps.Item>Añadir Observaciones</Steps.Item>
      </Steps>
      {step === 0 && (
        <Scanner
          onScan={(result) => handleReadCode(result)}
          paused={scanQRKidGuardianSlice.loading}
        />
      )}
      {step === 1 && (
        <>
          <h1
            style={{
              textAlign: 'center',
              fontSize: 32,
              marginTop: 5,
              marginBottom: 5,
            }}
          >
            Acudiente
          </h1>
          <p
            style={{
              textAlign: 'center',
              fontSize: 22,
              marginTop: 5,
              marginBottom: 5,
            }}
          >
            {capitalizeWords(
              scanQRKidGuardianSlice.kidGuardian?.firstName ?? '',
            )}
          </p>
          <p
            style={{
              textAlign: 'center',
              fontSize: 18,
              marginTop: 0,
              marginBottom: 5,
            }}
          >
            {capitalizeWords(
              scanQRKidGuardianSlice.kidGuardian?.lastName ?? '',
            )}
          </p>
          <h3 style={{ textAlign: 'center' }}>
            Confirme que sea el acudiente y luego seleccione los niños a
            registrar
          </h3>

          {/* <CheckList
            multiple
            style={{ marginBottom: 10 }}
            activeIcon={<CheckCircleTwoTone />}
            onChange={(values: any[]) => setRelationSelectToRegister(values)}
          >
            {relationsToRegister.map((relation: any) => (
              <CheckList.Item
                value={relation.id}
                key={relation.id}
                disabled={
                  !!relation.currentKidRegistration || relation.age >= 12
                }
                description={`Codigo: ${relation.faithForgeId} - Salon: ${
                  relation.kidGroup.name
                } ${relation.staticGroup ? '(Estatico)' : ''}`}
              >
                {capitalizeWords(relation.firstName)}{' '}
                {capitalizeWords(relation.lastName)}{' '}
                {!!relation.currentKidRegistration ? '(Registrado)' : ''}
              </CheckList.Item>
            ))}
          </CheckList> */}
          <Button
            block
            color="primary"
            size="large"
            onClick={confirmKidToRegister}
          >
            <Space>
              <span>Siguiente</span>
              {/* <ArrowRightOutlined /> */}
            </Space>
          </Button>
        </>
      )}
      {step === 2 && (
        <Form
          form={form}
          layout="vertical"
          onFinish={onRegisterKids}
          footer={
            <Button block type="primary" size="large">
              <Space>
                <span>Registrar niños</span>
                {/* <CheckCircleOutlined /> */}
              </Space>
            </Button>
          }
        >
          <p
            style={{
              textAlign: 'center',
              fontSize: 14,
              marginTop: 10,
              marginBottom: 15,
            }}
          >
            Si los niños tienen alguna observación colocarla. (Abrir el
            desplegable y añadir la observación)
          </p>

          <Collapse
            accordion
            // arrow={(active) => (active ? <MinusOutlined /> : <PlusOutlined />)}
            style={{
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            {relationsToRegister.map((relation: any) => (
              <Collapse.Item
                key={relation.id}
                title={`${capitalizeWords(relation.firstName)} 
                  ${capitalizeWords(relation.lastName)} - ${
                    relation.kidGroup.name
                  } ${relation.staticGroup ? '(Estatico)' : ''}`}
              >
                <Form.Item
                  name={`observations-${relation.id}`}
                  label="Observaciones"
                >
                  <Input.TextArea
                    placeholder="Ejemplo: lleva bolso, lleva merienda, está enfermo de algo en el momento."
                    maxLength={300}
                    rows={3}
                    showWordLimit
                  />
                </Form.Item>
              </Collapse.Item>
            ))}
          </Collapse>
        </Form>
      )}
    </Layout>
  );
};

export default QRReader;
