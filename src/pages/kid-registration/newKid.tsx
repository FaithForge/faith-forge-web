/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Form,
  Button,
  Input,
  Selector,
  Switch,
  Image,
  Typography,
  DatetimePicker,
} from 'react-vant';
import KidRegistrationView from '../../components/KidRegistrationView';
import { Layout } from '../../components/Layout';
import LoadingMask from '../../components/LoadingMask';
import MobileInputApp, { checkPhoneField } from '../../components/MobileInputApp';
import { ModalSelectorApp } from '../../components/ModalSelectorApp';
import NavBarApp from '../../components/NavBarApp';
import { ModalCheckerApp } from '../../components/ModalCheckerApp';
import { TbCameraPlus } from 'react-icons/tb';
import dayjs from 'dayjs';
import { DateTime } from 'luxon';
import { MdKeyboardArrowRight } from 'react-icons/md';
import NationalIdTypeInputApp from '../../components/NationalIdTypeInputApp';
import {
  UserGenderCode,
  kidRelationSelect,
  ID_TYPE_CODE_MAPPER,
  userGenderSelect,
  healthSecurityEntitySelect,
  IdType,
  UserIdType,
} from '@/libs/models';
import {
  RootState,
  AppDispatch,
  cleanCurrentKidGuardian,
  GetKidGroups,
  GetKidMedicalConditions,
  GetKidGuardian,
  loadingKidEnable,
  UploadUserImage,
  CreateKid,
  CreateKidGuardian,
} from '@/libs/state/redux';
import { calculateAge, getAgeInMonths } from '@/libs/utils/date';
import { resizeAndCropImageToSquare } from '@/libs/utils/image';
import { capitalizeWords } from '@/libs/utils/text';
import { checkLastNameField } from '@/libs/utils/validator';
import { toast } from 'sonner';
import { ColorType } from '@/libs/common-types/constants/theme';
import Steps from '@/components/Steps';

const NewKid: NextPage = () => {
  const [form] = Form.useForm();
  const [formKidGuardian] = Form.useForm();

  const router = useRouter();
  const kidSlice = useSelector((state: RootState) => state.kidSlice);
  const kidGroupSlice = useSelector((state: RootState) => state.kidGroupSlice);
  const kidGuardianSlice = useSelector((state: RootState) => state.kidGuardianSlice);
  const kidMedicalConditionSlice = useSelector(
    (state: RootState) => state.kidMedicalConditionSlice,
  );

  const [source, setSource] = useState('');
  const [photo, setPhoto] = useState<any>(null);
  const [staticGroup, setStaticGroup] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedGender, setSelectedGender] = useState<UserGenderCode>();
  const [kidRelationSelectFilter, setKidRelationSelectFilter] = useState(kidRelationSelect);
  const dispatch = useDispatch<AppDispatch>();
  const now = DateTime.local().endOf('year').toJSDate();

  const handleCapture = async (target: HTMLInputElement) => {
    if (target.files) {
      if (target.files.length !== 0) {
        const file = target.files[0];

        try {
          // Redimensiona la imagen
          const resizedBlob = await resizeAndCropImageToSquare(file, 500, 500 * 1024); // 800px, 500 KB
          const resizedUrl = URL.createObjectURL(resizedBlob);

          // Guarda la imagen redimensionada
          setSource(resizedUrl);
          setPhoto(resizedBlob);
        } catch (err) {
          console.error('Error al redimensionar la imagen:', err);
        }
      }
    }
  };

  useEffect(() => {
    dispatch(cleanCurrentKidGuardian());
    return () => {
      dispatch(cleanCurrentKidGuardian());
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(GetKidGroups({}));
    dispatch(GetKidMedicalConditions());
  }, [dispatch]);

  useEffect(() => {
    if (kidGuardianSlice.current) {
      formKidGuardian.setFieldsValue({
        guardianNationalIdType: {
          value: kidGuardianSlice.current?.nationalIdType,
          label: ID_TYPE_CODE_MAPPER[kidGuardianSlice.current?.nationalIdType],
        },
        guardianNationalId: kidGuardianSlice.current?.nationalId,
        guardianFirstName: capitalizeWords(kidGuardianSlice.current?.firstName),
        guardianLastName: capitalizeWords(kidGuardianSlice.current?.lastName),
        guardianPhone: {
          prefix: kidGuardianSlice.current?.dialCodePhone,
          value: kidGuardianSlice.current?.phone,
        },
        guardianGender: [kidGuardianSlice.current?.gender],
        guardianRelation: [kidGuardianSlice.current?.relation],
      });
      setSelectedGender(kidGuardianSlice.current?.gender);
    }
  }, [formKidGuardian, kidGuardianSlice]);

  useEffect(() => {
    if (!staticGroup) {
      form.resetFields(['kidGroup']);
    }
  }, [form, staticGroup]);

  useEffect(() => {
    if (kidSlice.error) {
      toast.error(`Ha ocurrido un error al crear al niño: ${kidSlice.error}`, {
        duration: 5000,
        style: { color: 'white' },
      });
    }
  }, [kidSlice]);

  useEffect(() => {
    if (kidGuardianSlice.error) {
      toast.error(`Ha ocurrido un error al crear el acudiente: ${kidGuardianSlice.error}`, {
        duration: 5000,
        style: { color: 'white' },
      });
    }
  }, [kidGuardianSlice]);

  useEffect(() => {
    if (step === 3) {
      router.back();
    }
  }, [router, step]);

  const findGuardian = async () => {
    const guardianNationalId = formKidGuardian.getFieldsValue().guardianNationalId;
    if (guardianNationalId) dispatch(GetKidGuardian(guardianNationalId));
  };

  const cleanGuardian = async () => {
    dispatch(cleanCurrentKidGuardian());
    formKidGuardian.resetFields([
      'guardianNationalIdType',
      'guardianNationalId',
      'guardianFirstName',
      'guardianLastName',
      'guardianPhone',
      'guardianGender',
      'guardianRelation',
    ]);
  };

  const [medicalCondition, setMedicalCondition] = useState({
    id: '',
    name: '',
  });

  const [healthSecurityEntity, setHealthSecurityEntity] = useState({
    id: '',
    name: '',
  });
  const checkHealthSecurityEntity = (_: any, value: { id: string; name: string }) => {
    if (value.id) {
      setHealthSecurityEntity(value);
      return Promise.resolve();
    }
    return Promise.reject();
  };

  const addNewKid = async (values: any) => {
    dispatch(loadingKidEnable());

    let photoUrl = undefined;
    if (photo) {
      const formData = new FormData();
      formData.append('file', photo);

      photoUrl = (await dispatch(UploadUserImage({ formData }))).payload as string;
    }

    try {
      const response = await dispatch(
        CreateKid({
          firstName: values.firstName,
          lastName: values.lastName,
          birthday: values.birthday,
          gender: values.gender ? values.gender[0] : undefined,
          staticGroup: values.staticGroup ?? false,
          staticKidGroupId: values.kidGroup ? values.kidGroup[0] : undefined,
          observations: values.observations ?? undefined,
          photoUrl,
          healthSecurityEntity: values.healthSecurityEntity.name,
          medicalConditionId: medicalCondition.id !== '' ? medicalCondition.id : undefined,
        }),
      );

      if (!response.payload.error) {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        setStep(2);
      }
    } catch {
      toast.error(`Ha ocurrido un error al crear el niño.`, {
        duration: 5000,
        style: { color: 'white' },
      });
    }
  };

  const addNewKidGuardian = async (values: any) => {
    if (kidSlice.current?.id) {
      const nationalIdType = values.guardianNationalIdType.value;
      const nationalId = values.guardianNationalId;
      const firstName = values.guardianFirstName;
      const lastName = values.guardianLastName;
      const phone = values.guardianPhone;
      const gender = values.guardianGender[0];
      const relation = values.guardianRelation[0];
      const kidId = kidSlice.current?.id;

      const response = await dispatch(
        CreateKidGuardian({
          kidId,
          nationalIdType,
          nationalId,
          firstName,
          lastName,
          dialCodePhone: phone.prefix,
          phone: phone.value,
          gender,
          relation,
        }),
      );

      if (!response.payload.error) {
        toast.info(`Se ha creado al niño y acudiente con éxito. Proceda a registrarlo`, {
          duration: 3000,
          style: { color: 'white' },
        });
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        setStep(3);
      }
    }
  };

  const kidGroupsSelect = kidGroupSlice.data
    ? kidGroupSlice.data.map((kidGroup: any) => {
        return {
          label: kidGroup.name,
          value: kidGroup.id,
        };
      })
    : [];

  useEffect(() => {
    let filter;
    if (selectedGender) {
      filter = kidRelationSelect.filter((kidRelation) => kidRelation.gender === selectedGender);
    } else {
      filter = kidRelationSelect;
    }
    setKidRelationSelectFilter(filter);
  }, [selectedGender]);

  let titleNavBar = '';
  switch (step) {
    case 0:
      titleNavBar = 'Crear Niño';
      break;
    case 1:
      titleNavBar = 'Crear Acudiente';
      break;
    case 2:
      titleNavBar = 'Registrar niño';
      break;
  }

  return (
    <Layout>
      {kidGuardianSlice.loading || kidSlice.loading ? <LoadingMask /> : ''}
      <NavBarApp title={titleNavBar} />
      <Steps
        colorType={ColorType.INFO}
        currentStep={step}
        steps={[
          { value: 1, label: 'Crear niño' },
          { value: 2, label: 'Crear Acudiente' },
          { value: 3, label: 'Registrar Niño' },
        ]}
      />
      {step === 1 && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <label htmlFor="profileImage" style={{ alignItems: 'center' }}>
              {source ? (
                <Image
                  alt="profileImage"
                  src={source}
                  width={160}
                  height={160}
                  fit="cover"
                  radius={100}
                />
              ) : (
                <TbCameraPlus fontSize={160} />
              )}
            </label>
          </div>
          <input
            accept="image/*"
            id="profileImage"
            type="file"
            capture="environment"
            hidden={true}
            onChange={(e) => handleCapture(e.target)}
          />

          <Form
            form={form}
            onFinish={addNewKid}
            layout="horizontal"
            footer={
              <Form.Item style={{ paddingBottom: 20 }}>
                <Button type="primary" size="large" nativeType="submit">
                  Siguiente
                </Button>
              </Form.Item>
            }
          >
            <Form.Item>
              <Typography.Title level={4}>Información Básica</Typography.Title>
            </Form.Item>
            <Form.Item
              name="firstName"
              label="Nombre"
              rules={[{ required: true, message: 'Nombre es requerido' }]}
            >
              <Input placeholder="Escribir nombre..." autoComplete="false" />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Apellido"
              rules={[
                {
                  required: true,
                  message: 'Apellido es requerido',
                },
                {
                  required: true,
                  message: 'Se debe colocar ambos apellidos',
                  validator: checkLastNameField,
                },
              ]}
            >
              <Input placeholder="Escribir apellido..." autoComplete="false" />
            </Form.Item>
            <Form.Item
              isLink
              name="birthday"
              label="Fecha de nacimiento"
              trigger="onConfirm"
              onClick={(_, action) => {
                action?.current?.open();
              }}
              rules={[{ required: true, message: 'Fecha de nacimiento es requerida' }]}
            >
              <DatetimePicker
                popup
                type="date"
                minDate={dayjs().subtract(12, 'year').toDate()}
                maxDate={now}
                title={'Fecha de nacimiento'}
                cancelButtonText={'Cancelar'}
                confirmButtonText={'Confirmar'}
              >
                {(value: Date) =>
                  value
                    ? `${dayjs(value).format('YYYY-MM-DD')} (Tiene: ${Math.floor(
                        calculateAge(value) ?? 0,
                      )} años y ${
                        getAgeInMonths(value) - Math.floor(calculateAge(value)) * 12
                      } meses)`
                    : 'Seleccionar fecha'
                }
              </DatetimePicker>
            </Form.Item>
            <Form.Item
              name="gender"
              label="Género"
              rules={[
                {
                  required: true,
                  message: 'Por favor seleccione el género del niño',
                },
              ]}
            >
              <Selector options={userGenderSelect} />
            </Form.Item>

            <Form.Item
              label="EPS"
              required={true}
              name="healthSecurityEntity"
              rules={[
                {
                  required: true,
                  message: 'Digitar la EPS del niño',
                  validator: checkHealthSecurityEntity,
                },
              ]}
            >
              <ModalSelectorApp
                options={healthSecurityEntitySelect}
                placeholder="Buscar EPS"
                value={healthSecurityEntity}
                emptyOption={{ id: 'NO TIENE EPS', name: 'NO TIENE EPS' }}
              />
            </Form.Item>

            <Form.Item>
              <Typography.Title level={4}>Información Adicional (Opcional)</Typography.Title>
            </Form.Item>
            <Form.Item name="staticGroup" label="Asignar salón estático">
              <Switch onChange={(value) => setStaticGroup(value)} defaultChecked={staticGroup} />
            </Form.Item>
            {staticGroup && (
              <Form.Item
                name="kidGroup"
                label="Salón estatico"
                rules={[
                  {
                    required: staticGroup,
                    message: 'Por favor seleccione un salón',
                  },
                ]}
              >
                <Selector options={kidGroupsSelect} />
              </Form.Item>
            )}

            <Form.Item label="Condición médica" name="medicalCondition">
              <ModalCheckerApp
                options={kidMedicalConditionSlice.data.filter(
                  (d) => d.id !== 'a18647b1-3455-4407-ada0-c94f39251e8c',
                )}
                placeholder="Buscar condición médica"
                value={medicalCondition}
                onChange={setMedicalCondition}
                emptyOption={{
                  id: 'a18647b1-3455-4407-ada0-c94f39251e8c',
                  name: 'Otra',
                }}
              />
            </Form.Item>
            <Form.Item name="observations" label="Observaciones">
              <Input.TextArea
                placeholder="Si seleccionó Otra condición describala aquí"
                maxLength={300}
                rows={2}
                showWordLimit
              />
            </Form.Item>
          </Form>
        </>
      )}

      {step === 2 && (
        <>
          <Form
            form={formKidGuardian}
            onFinish={addNewKidGuardian}
            layout="horizontal"
            footer={
              <Form.Item style={{ paddingBottom: 20 }}>
                <Button type="primary" size="large" nativeType="submit">
                  Guardar Acudiente
                </Button>
              </Form.Item>
            }
          >
            <Form.Item>
              <Typography.Title level={4}>Información del Acudiente</Typography.Title>
            </Form.Item>
            <Form.Item
              initialValue={{ label: IdType.CC, value: UserIdType.CC }}
              name="guardianNationalIdType"
              label="Tipo de documento"
              disabled={!!kidGuardianSlice.current}
              rightIcon={<MdKeyboardArrowRight size={24} />}
              rules={[
                {
                  required: true,
                  message: 'Por favor seleccione un tipo de documento',
                },
              ]}
            >
              <NationalIdTypeInputApp disabled={!!kidGuardianSlice.current} />
            </Form.Item>
            <Form.Item
              name="guardianNationalId"
              label="Número de documento"
              disabled={!!kidGuardianSlice.current}
              rules={[{ required: true, message: 'Número de documento es requerido' }]}
            >
              <Input
                placeholder="Escribir número de documento..."
                onBlur={findGuardian}
                autoComplete="false"
              />
            </Form.Item>
            <Form.Item
              name="guardianFirstName"
              label="Nombre"
              disabled={!!kidGuardianSlice.current}
              rules={[{ required: true, message: 'Nombre es requerido' }]}
            >
              <Input placeholder="Escribir nombre..." autoComplete="false" />
            </Form.Item>
            <Form.Item
              name="guardianLastName"
              label="Apellido"
              disabled={!!kidGuardianSlice.current}
              rules={[
                {
                  required: true,
                  message: 'Apellido es requerido',
                },
              ]}
            >
              <Input placeholder="Escribir apellido..." autoComplete="false" />
            </Form.Item>
            <Form.Item
              name="guardianPhone"
              label="Teléfono"
              disabled={!!kidGuardianSlice.current}
              rules={[
                {
                  required: true,
                  message: 'Por favor digite el numero teléfono del acudiente',
                },
                {
                  required: true,
                  message: 'El teléfono debe tener minimo 7 digitos',
                  validator: checkPhoneField,
                },
              ]}
            >
              <MobileInputApp disabled={!!kidGuardianSlice.current} />
            </Form.Item>
            <Form.Item
              name="guardianGender"
              label="Género"
              disabled={!!kidGuardianSlice.current}
              rules={[
                {
                  required: true,
                  message: 'Por favor seleccione el género del acudiente',
                },
              ]}
            >
              <Selector
                options={userGenderSelect}
                onChange={(v) => {
                  if (v.length) {
                    setSelectedGender(v[0]);
                  }
                }}
              />
            </Form.Item>
            <Form.Item
              name="guardianRelation"
              label="Relación con el niño"
              rules={[
                {
                  required: true,
                  message: 'Por favor seleccione una relación',
                },
              ]}
            >
              <Selector options={kidRelationSelectFilter} />
            </Form.Item>

            {kidGuardianSlice.current ? (
              <Form.Item>
                <Button block type="default" onClick={cleanGuardian} size="large">
                  Limpiar formulario acudiente
                </Button>
              </Form.Item>
            ) : null}
          </Form>
        </>
      )}

      {step === 3 && <KidRegistrationView />}
    </Layout>
  );
};

export default NewKid;
