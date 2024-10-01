/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import NavBarApp from '../../components/NavBarApp';
// import { RefObject } from 'react';
// import dayjs from 'dayjs';
import {
  UserGenderCode,
  idGuardianTypeSelect,
  userGenderSelect,
} from '../../models/User';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { capitalizeWords } from '../../utils/text';
import LoadingMask from '../../components/LoadingMask';

import { useRouter } from 'next/router';
// import { DateTime } from 'luxon';
// import {
//   calculateAge,
//   getAgeInMonths,
//   labelRendererCalendar,
// } from '../../utils/date';
import { HealthSecurityEntitySelector } from '../../components/HealthSecurityEntitySelector';
import {
  Steps,
  Toast,
  Form,
  Button,
  Input,
  Selector,
  Switch,
  Space,
  Popup,
  Search,
} from 'react-vant';
import KidRegistrationView from '../../components/KidRegistrationView';
import { kidRelationSelect } from '../../models/KidChurch';
import { cleanCurrentKidGuardian } from '../../redux/slices/kid-church/kid-guardian.slice';
import { loadingKidEnable } from '../../redux/slices/kid-church/kid.slice';
import { GetKidGroups } from '../../redux/thunks/kid-church/kid-group.thunk';
import { GetKidGuardian, CreateKidGuardian } from '../../redux/thunks/kid-church/kid-guardian.thunk';
import { GetKidMedicalConditions } from '../../redux/thunks/kid-church/kid-medical-condition.thunk';
import { CreateKid } from '../../redux/thunks/kid-church/kid.thunk';
import { UploadUserImage } from '../../redux/thunks/user/user.thunk';
import { checkLastNameField, checkPhoneField } from '../../utils/validator';
import { Layout } from '../../components/Layout';

const NewKid: NextPage = () => {
  const [form] = Form.useForm();
  const [formKidGuardian] = Form.useForm();

  const router = useRouter();
  const kidSlice = useSelector((state: RootState) => state.kidSlice);
  const kidGroupSlice = useSelector((state: RootState) => state.kidGroupSlice);
  const kidGuardianSlice = useSelector(
    (state: RootState) => state.kidGuardianSlice,
  );
  const kidMedicalConditionSlice = useSelector(
    (state: RootState) => state.kidMedicalConditionSlice,
  );

  // const now = DateTime.local().endOf('year').toJSDate();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [source, setSource] = useState('');
  const [photo, setPhoto] = useState<any>(null);
  const [staticGroup, setStaticGroup] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedGender, setSelectedGender] = useState<UserGenderCode>();
  const [kidRelationSelectFilter, setKidRelationSelectFilter] =
    useState(kidRelationSelect);
  const dispatch = useDispatch<AppDispatch>();

  const handleCapture = (target: any) => {
    if (target.files) {
      if (target.files.length !== 0) {
        const file = target.files[0];
        const newUrl = URL.createObjectURL(file);
        setSource(newUrl);
        setPhoto(file);
      }
    }
  };

  useEffect(() => {
    dispatch(cleanCurrentKidGuardian());
    return () => {
      dispatch(cleanCurrentKidGuardian());
    };
  }, []);

  useEffect(() => {
    dispatch(GetKidGroups());
    dispatch(GetKidMedicalConditions());
  }, [dispatch]);

  useEffect(() => {
    if (kidGuardianSlice.current) {
      formKidGuardian.setFieldsValue({
        guardianNationalIdType: [kidGuardianSlice.current?.nationalIdType],
        guardianNationalId: kidGuardianSlice.current?.nationalId,
        guardianFirstName: capitalizeWords(kidGuardianSlice.current?.firstName),
        guardianLastName: capitalizeWords(kidGuardianSlice.current?.lastName),
        guardianPhone: kidGuardianSlice.current?.phone,
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
      Toast.fail({
        message: `Ha ocurrido un error al crear al niño: ${kidSlice.error}`,
        position: 'bottom',
        duration: 5000,
      });
    }
  }, [kidSlice]);

  useEffect(() => {
    if (kidGuardianSlice.error) {
      Toast.fail({
        message: `Ha ocurrido un error al crear el acudiente: ${kidGuardianSlice.error}`,
        position: 'bottom',
        duration: 5000,
      });
    }
  }, [kidGuardianSlice]);

  useEffect(() => {
    if (step === 3) {
      router.back();
    }
  }, [router, step]);

  const findGuardian = async () => {
    const guardianNationalId =
      formKidGuardian.getFieldsValue().guardianNationalId;
    dispatch(GetKidGuardian(guardianNationalId));
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

  const [searchMedicalCondition, setSearchMedicalCondition] = useState('');
  const [visibleMedicalCondition, setVisibleMedicalCondition] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [medicalCondition, setMedicalCondition] = useState({
    id: '',
    name: '',
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filteredMedicalConditions = useMemo(() => {
    if (searchMedicalCondition) {
      return kidMedicalConditionSlice.data.filter((item: any) =>
        item.name
          .toLocaleLowerCase()
          .includes(searchMedicalCondition.toLocaleLowerCase()),
      );
    } else {
      return kidMedicalConditionSlice.data;
    }
  }, [kidMedicalConditionSlice.data, searchMedicalCondition]);

  const [healthSecurityEntity, setHealthSecurityEntity] = useState({
    id: '',
    name: '',
  });
  const checkHealthSecurityEntity = (
    _: any,
    value: { id: string; name: string },
  ) => {
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

      photoUrl = (await dispatch(UploadUserImage({ formData })))
        .payload as string;
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
          medicalConditionId:
            medicalCondition.id !== '' ? medicalCondition.id : undefined,
        }),
      );

      if (!response.payload.error) {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        setStep(1);
      }
    } catch (error) {
      Toast.fail({
        message: 'Ha ocurrido un error al crear el niño.',
        position: 'bottom',
        duration: 5000,
      });
    }
  };

  const addNewKidGuardian = async (values: any) => {
    if (kidSlice.current?.id) {
      const nationalIdType = values.guardianNationalIdType[0];
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
          phone,
          gender,
          relation,
        }),
      );

      if (!response.payload.error) {
        Toast.info({
          message:
            'Se ha creado al niño y acudiente con éxito. Proceda a registrarlo',
          position: 'bottom',
          duration: 3000,
        });
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        setStep(2);
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
      filter = kidRelationSelect.filter(
        (kidRelation) => kidRelation.gender === selectedGender,
      );
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
      <Steps active={step}>
        <Steps>Crear niño </Steps>
        <Steps>Crear Acudiente</Steps>
        <Steps>Registrar Niño</Steps>
      </Steps>
      {step === 0 && (
        <>
          {/* <label htmlFor="profileImage">
            {source ? (
              <Image
                alt="profileImage"
                src={source}
                width={160}
                height={160}
                fit="cover"
                style={{ borderRadius: '50%' }}
              />
            ) : (
              <CameraOutline fontSize={160} />
            )}
          </label> */}
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
              <Button block type="primary" size="large">
                Siguiente
              </Button>
            }
          >
            <h3>Información Básica</h3>
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
              name="birthday"
              label="Fecha de nacimiento"
              trigger="onConfirm"
              // onClick={(e, datePickerRef: RefObject<DatePickerRef>) => {
              //   datePickerRef.current?.open();
              // }}
              rules={[
                { required: true, message: 'Fecha de nacimiento es requerida' },
              ]}
            >
              {/* <DatePicker
                max={now}
                min={dayjs().subtract(12, 'year').toDate()}
                title={'Fecha de nacimiento'}
                cancelText={'Cancelar'}
                confirmText={'Confirmar'}
                renderLabel={(type: string, data: number) =>
                  labelRendererCalendar(type, data)
                }
              >
                {(value) =>
                  value
                    ? `${dayjs(value).format(
                        'YYYY-MM-DD',
                      )} (Tiene: ${Math.floor(
                        calculateAge(value) ?? 0,
                      )} años y ${
                        getAgeInMonths(value) -
                        Math.floor(calculateAge(value)) * 12
                      } meses)`
                    : 'Seleccionar fecha'
                }
              </DatePicker> */}
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
              <HealthSecurityEntitySelector
                healthSecurityEntity={healthSecurityEntity}
              />
            </Form.Item>

            <h3>Información Adicional (Opcional)</h3>
            <Form.Item
              name="staticGroup"
              label="Asignar salón estático"
              // childElementPosition="right"
            >
              <Switch
                onChange={(value) => setStaticGroup(value)}
                defaultChecked={staticGroup}
              />
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

            <Form.Item>
              <p>Selecciona condición médica</p>
              <Space align="center">
                <Button
                  onClick={() => {
                    setVisibleMedicalCondition(true);
                  }}
                >
                  Buscar...
                </Button>
                <div>{medicalCondition.name}</div>
              </Space>
              <Popup
                visible={visibleMedicalCondition}
                onClickOverlay={() => {
                  setVisibleMedicalCondition(false);
                }}
                position="top"
                destroyOnClose
              >
                <div>
                  <Search
                    placeholder="Buscar condición médica"
                    value={searchMedicalCondition}
                    onChange={(v) => {
                      setSearchMedicalCondition(v);
                    }}
                    style={{
                      padding: '12px',
                      borderBottom: 'solid 1px var(--adm-color-border)',
                    }}
                  />
                </div>
                {/* <div style={{ height: '300px', overflowY: 'scroll' }}>
                  <CheckList
                    style={{ '--border-top': '0', '--border-bottom': '0' }}
                    defaultValue={medicalCondition ? [medicalCondition.id] : []}
                    onChange={(val) => {
                      let medicalConditionSelected =
                        kidMedicalConditionSlice.data
                          .map((kidMedicalCondition) => {
                            return {
                              id: kidMedicalCondition.id,
                              name: `${kidMedicalCondition.name} - ${kidMedicalCondition.code}`,
                            };
                          })
                          .find((item) => item.id === val[0]);
                      if (
                        !medicalConditionSelected &&
                        val[0] === 'a18647b1-3455-4407-ada0-c94f39251e8c'
                      ) {
                        medicalConditionSelected = {
                          id: 'a18647b1-3455-4407-ada0-c94f39251e8c',
                          name: 'Otra',
                        };
                      }
                      setMedicalCondition(
                        medicalConditionSelected
                          ? {
                              id: medicalConditionSelected.id,
                              name: medicalConditionSelected.name,
                            }
                          : { id: '', name: '' },
                      );
                      setVisibleMedicalCondition(false);
                    }}
                  >
                    {filteredMedicalConditions
                      ? filteredMedicalConditions.map((condition) => (
                          <CheckList.Item
                            key={condition.id}
                            value={condition.id}
                          >
                            {condition.name} - {condition.code}
                          </CheckList.Item>
                        ))
                      : null}
                    <CheckList.Item
                      key={'a18647b1-3455-4407-ada0-c94f39251e8c'}
                      value={'a18647b1-3455-4407-ada0-c94f39251e8c'}
                    >
                      Otra
                    </CheckList.Item>
                  </CheckList>
                </div> */}
              </Popup>
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

      {step === 1 && (
        <>
          <Form
            form={formKidGuardian}
            onFinish={addNewKidGuardian}
            layout="horizontal"
            footer={
              <Button block type="primary" size="large">
                Guardar Acudiente
              </Button>
            }
          >
            <h3>Información del Acudiente</h3>
            <Form.Item
              name="guardianNationalIdType"
              label="Tipo de documento"
              disabled={!!kidGuardianSlice.current}
              rules={[
                {
                  required: true,
                  message: 'Por favor seleccione un tipo de documento',
                },
              ]}
            >
              <Selector options={idGuardianTypeSelect} />
            </Form.Item>
            <Form.Item
              name="guardianNationalId"
              label="Número de documento"
              disabled={!!kidGuardianSlice.current}
              rules={[
                { required: true, message: 'Número de documento es requerido' },
              ]}
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
                  message: 'Por favor digite el número teléfono del acudiente',
                },
                {
                  required: true,
                  message: 'El telefono debe tener minimo 10 digitos',
                  validator: checkPhoneField,
                },
              ]}
            >
              <Input
                placeholder="Escribir telefono..."
                type="tel"
                autoComplete="false"
              />
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
            <Form.Item>
              {kidGuardianSlice.current ? (
                <Button
                  block
                  color="default"
                  onClick={cleanGuardian}
                  size="large"
                >
                  Limpiar formulario acudiente
                </Button>
              ) : null}
            </Form.Item>
          </Form>
        </>
      )}

      {step === 2 && <KidRegistrationView />}
    </Layout>
  );
};

export default NewKid;
