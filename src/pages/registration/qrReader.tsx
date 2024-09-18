import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import NavBarApp from '../../components/NavBarApp';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import LoadingMask from '../../components/LoadingMask';
import { Layout } from '@/components/Layout';
import { IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import {
  Button,
  CheckList,
  Collapse,
  Form,
  Space,
  Steps,
  TextArea,
  Toast,
} from 'antd-mobile';
import {
  CreateKidRegistration,
  ScanCodeKidRegistration,
} from '@/redux/thunks/kid-church/kid-registration.thunk';
import { usePathname, useRouter } from 'next/navigation';
import { cleanScanQRSearch } from '@/redux/slices/kid-church/scan-code-kid-registration.slice';
import { capitalizeWords } from '@/utils/text';
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  CheckCircleTwoTone,
} from '@ant-design/icons';
import { Step } from 'antd-mobile/es/components/steps/step';

const QRReader: NextPage = () => {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const scanQRKidGuardianSlice = useSelector(
    (state: RootState) => state.scanQRKidGuardianSlice,
  );
  const [relationsToRegister, setRelationsToRegister] = useState(
    scanQRKidGuardianSlice.relations,
  );
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
      Toast.show({
        content: 'Código Invalido',
        position: 'bottom',
        duration: 3000,
        icon: 'fail',
      });
    } else {
      dispatch(ScanCodeKidRegistration(code));
    }
  };

  const confirmKidToRegister = () => {
    if (!relationSelectToRegister.length) {
      Toast.show({
        icon: 'fail',
        content: `Seleccione al menos un niño`,
        position: 'center',
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
        Toast.show({
          content: 'Se ha registrado al niño con exito',
          position: 'bottom',
          duration: 3000,
        });
      }
    }
    Toast.show({
      content: 'Se ha registrado con exito a todos los niños',
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
      Toast.show({
        content: scanQRKidGuardianSlice.error,
        position: 'bottom',
        duration: 3000,
        icon: 'fail',
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

  return (
    <Layout>
      {scanQRKidGuardianSlice.loading ? <LoadingMask /> : ''}
      <NavBarApp title={titleNavBar} />
      <Steps current={step}>
        <Step title="Escanear Codigo" />
        <Step title="Escoger Niños a Registrar" />
        <Step title="Añadir Observaciones" />
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
          <h2
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
          </h2>
          <h2
            style={{
              textAlign: 'center',
              fontSize: 22,
              marginTop: 0,
              marginBottom: 5,
            }}
          >
            {capitalizeWords(
              scanQRKidGuardianSlice.kidGuardian?.lastName ?? '',
            )}
          </h2>
          <h3>Seleccione los niños a registrar</h3>

          <CheckList
            multiple
            style={{ marginBottom: 10 }}
            activeIcon={<CheckCircleTwoTone />}
            onChange={(values: any[]) => setRelationSelectToRegister(values)}
          >
            {relationsToRegister.map((relation: any) => (
              <CheckList.Item
                value={relation.id}
                key={relation.id}
                disabled={!!relation.currentKidRegistration}
              >
                {capitalizeWords(relation.firstName)}{' '}
                {capitalizeWords(relation.lastName)}{' '}
                {!!relation.currentKidRegistration ? '(Registrado)' : ''}
              </CheckList.Item>
            ))}
          </CheckList>
          <Button
            block
            color="primary"
            size="large"
            onClick={confirmKidToRegister}
          >
            <Space>
              <span>Siguiente</span>
              <ArrowRightOutlined />
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
            <Button block type="submit" color="primary" size="large">
              <Space>
                <span>Registrar niños</span>
                <CheckCircleOutlined />
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
            style={{
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            {relationsToRegister.map((relation: any) => (
              <Collapse.Panel
                key={relation.id}
                title={`${capitalizeWords(relation.firstName)} 
                  ${capitalizeWords(relation.lastName)}`}
              >
                <Form.Item
                  name={`observations-${relation.id}`}
                  label="Observaciones"
                >
                  <TextArea
                    placeholder="Ejemplo: lleva bolso, lleva merienda, está enfermo de algo en el momento."
                    maxLength={300}
                    rows={3}
                    showCount
                  />
                </Form.Item>
              </Collapse.Panel>
            ))}
          </Collapse>
        </Form>
      )}
    </Layout>
  );
};

export default QRReader;
