/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AppDispatch,
  cleanScanQRSearch,
  CreateKidRegistration,
  RootState,
  ScanCodeKidRegistration,
} from '@/libs/state/redux';
import { capitalizeWords } from '@/libs/utils/text';
import { IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import type { NextPage } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AiOutlineQrcode } from 'react-icons/ai';
import { FaArrowRight, FaRegCheckCircle } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Cell, Checkbox, Collapse, Form, Input, Space, Steps } from 'react-vant';
import { Layout } from '../../components/Layout';
import LoadingMask from '../../components/LoadingMask';
import NavBarApp from '../../components/NavBarApp';
import { PopoverApp, PopoverAppAction } from '../../components/PopoverApp';
import { toast } from 'sonner';

const QRReader: NextPage = () => {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const scanQRKidGuardianSlice = useSelector((state: RootState) => state.scanQRKidGuardianSlice);
  const [relationsToRegister, setRelationsToRegister] = useState(scanQRKidGuardianSlice.relations);
  const [relationSelectToRegister, setRelationSelectToRegister] = useState<string[]>([]);
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
      toast.error(`Código Invalido`, {
        duration: 3000,
        style: { color: 'white' },
      });
    } else {
      dispatch(ScanCodeKidRegistration(code));
    }
  };

  const confirmKidToRegister = () => {
    if (!relationSelectToRegister.length) {
      toast.error(`Seleccione al menos un niño`, {
        duration: 3000,
        style: { color: 'white' },
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
            observation: values ? values[`observations-${relationToRegister.id}`] : undefined,
          }),
        );
        toast.success(`Se ha registrado al niño con exito`, {
          duration: 1000,
          style: { color: 'white' },
        });
      }
    }
    toast.success(`Se ha registrado con exito a todos los niños`, {
      duration: 1000,
      style: { color: 'white' },
    });
    router.push('/kid-registration');
  };

  useEffect(() => {
    dispatch(cleanScanQRSearch());
  }, [dispatch, pathname]);

  useEffect(() => {
    if (scanQRKidGuardianSlice.error) {
      toast.error(scanQRKidGuardianSlice.error, {
        duration: 3000,
        style: { color: 'white' },
      });
    }
  }, [dispatch, scanQRKidGuardianSlice.error]);

  useEffect(() => {
    if (scanQRKidGuardianSlice.kidGuardian && scanQRKidGuardianSlice.relations) {
      setStep(1);
      setRelationsToRegister(scanQRKidGuardianSlice.relations);
    }
  }, [dispatch, scanQRKidGuardianSlice.kidGuardian, scanQRKidGuardianSlice.relations]);

  const actions: PopoverAppAction[] = [
    {
      key: 'updateKid',
      icon: <AiOutlineQrcode />,
      text: 'Generar QR Acudiente',
      onClick: () => {
        router.push('/kid-registration/generateQRKidGuardian');
      },
    },
  ];

  const toggle = (name: string) => {
    const newValue = relationSelectToRegister.includes(name)
      ? relationSelectToRegister.filter((el) => el !== name)
      : [...relationSelectToRegister, name];
    setRelationSelectToRegister(newValue);
  };

  return (
    <Layout>
      {scanQRKidGuardianSlice.loading ? <LoadingMask /> : ''}
      <NavBarApp
        title={titleNavBar}
        right={<PopoverApp actions={actions} icon={<HiDotsVertical size={'1.5em'} />} />}
      />
      <Steps active={step} activeColor="#397b9d">
        <Steps.Item>Escanear Codigo</Steps.Item>
        <Steps.Item>Niños a Registrar</Steps.Item>
        <Steps.Item>Observaciones</Steps.Item>
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
            {capitalizeWords(scanQRKidGuardianSlice.kidGuardian?.firstName ?? '')}
          </p>
          <p
            style={{
              textAlign: 'center',
              fontSize: 18,
              marginTop: 0,
              marginBottom: 5,
            }}
          >
            {capitalizeWords(scanQRKidGuardianSlice.kidGuardian?.lastName ?? '')}
          </p>
          <h3 style={{ textAlign: 'center' }}>
            Confirme que sea el acudiente y luego seleccione los niños a registrar
          </h3>
          <Checkbox.Group value={relationSelectToRegister} onChange={setRelationSelectToRegister}>
            <Cell.Group style={{ marginBottom: 10 }}>
              {relationsToRegister.map((relation: any) => (
                <Cell
                  key={relation.id}
                  style={{
                    backgroundColor: relation.currentKidRegistration ? '#ebebeb' : 'white',
                  }}
                  clickable
                  title={`${capitalizeWords(relation.firstName)} 
                ${capitalizeWords(relation.lastName)}
                ${relation.currentKidRegistration ? '(Registrado)' : ''}`}
                  label={`Codigo: ${relation.faithForgeId} - Salon: ${
                    relation.kidGroup.name
                  } ${relation.staticGroup ? '(Estatico)' : ''}`}
                  onClick={() => (relation.currentKidRegistration ? null : toggle(relation.id))}
                  rightIcon={
                    relation.currentKidRegistration ? null : <Checkbox name={relation.id} />
                  }
                  size="large"
                />
              ))}
            </Cell.Group>
          </Checkbox.Group>
          <Button block size="large" type="primary" onClick={confirmKidToRegister}>
            <Space>
              <span>Siguiente</span>
              <FaArrowRight />
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
            <Button block type="primary" size="large" nativeType="submit">
              <Space>
                <span>Registrar niños</span>
                <FaRegCheckCircle />
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
            Si los niños tienen alguna observación colocarla. (Abrir el desplegable y añadir la
            observación)
          </p>

          <Collapse
            accordion
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
                <Form.Item name={`observations-${relation.id}`} label="Observaciones">
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
