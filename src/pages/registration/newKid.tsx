import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import NavBarApp from '../../components/NavBarApp';
import { CameraOutline } from 'antd-mobile-icons';
import {
  Form,
  Input,
  Button,
  Switch,
  DatePicker,
  Image,
  AutoCenter,
  Selector,
  CheckList,
  SearchBar,
  Popup,
  Space,
  TextArea,
} from 'antd-mobile';
import { RefObject } from 'react';
import type { DatePickerRef } from 'antd-mobile/es/components/date-picker';
import dayjs from 'dayjs';
import { idGuardianTypeSelect, userGenderSelect } from '../../models/User';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { capitalizeWords } from '../../utils/text';
import LoadingMask from '../../components/LoadingMask';

import { useRouter } from 'next/router';
import { DateTime } from 'luxon';
import {
  calculateAge,
  getAgeInMonths,
  labelRendererCalendar,
} from '../../utils/date';
import { HealthSecurityEntitySelector } from '../../components/HealthSecurityEntitySelector';
import { cleanCurrentKidGuardian } from '@/redux/slices/kid-church/kid-guardian.slice';
import { GetKidGroups } from '@/redux/thunks/kid-church/kid-group.thunk';
import { GetKidMedicalConditions } from '@/redux/thunks/kid-church/kid-medical-condition.thunk';
import { GetKidGuardian } from '@/redux/thunks/kid-church/kid-guardian.thunk';
import { loadingKidEnable } from '@/redux/slices/kid-church/kid.slice';
import { uploadKidPhoto } from '@/services/kidService';
import { kidRelationSelect } from '@/models/KidChurch';
import { CreateKid } from '@/redux/thunks/kid-church/kid.thunk';
import { Layout } from '@/components/Layout';

const NewKid: NextPage = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const kidSlice = useSelector((state: RootState) => state.kidSlice);
  const kidGroupSlice = useSelector((state: RootState) => state.kidGroupSlice);
  const kidGuardianSlice = useSelector(
    (state: RootState) => state.kidGuardianSlice,
  );
  const kidMedicalConditionSlice = useSelector(
    (state: RootState) => state.kidMedicalConditionSlice,
  );

  const now = DateTime.local().endOf('year').toJSDate();

  const [source, setSource] = useState('');
  const [photo, setPhoto] = useState<any>(null);
  const [staticGroup, setStaticGroup] = useState(false);
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
      form.setFieldsValue({
        guardianNationalIdType: [kidGuardianSlice.current?.nationalIdType],
        guardianNationalId: kidGuardianSlice.current?.nationalId,
        guardianFirstName: capitalizeWords(kidGuardianSlice.current?.firstName),
        guardianLastName: capitalizeWords(kidGuardianSlice.current?.lastName),
        guardianPhone: kidGuardianSlice.current?.phone,
        guardianGender: [kidGuardianSlice.current?.gender],
        guardianRelation: [kidGuardianSlice.current?.relation],
      });
    }
  }, [form, kidGuardianSlice]);

  useEffect(() => {
    if (!staticGroup) {
      form.resetFields(['kidGroup']);
    }
  }, [form, staticGroup]);

  const findGuardian = async () => {
    const guardianNationalId = form.getFieldsValue().guardianNationalId;
    dispatch(GetKidGuardian(guardianNationalId));
  };

  const cleanGuardian = async () => {
    dispatch(cleanCurrentKidGuardian());
    form.resetFields([
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
  const [medicalCondition, setMedicalCondition] = useState({
    id: '',
    name: '',
  });
  const filteredMedicalConditions = useMemo(() => {
    if (searchMedicalCondition) {
      return kidMedicalConditionSlice.data.filter((item) =>
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
      formData.append('photo', photo);

      photoUrl = await uploadKidPhoto({ formData });
    }

    await dispatch(
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
        kidGuardian: {
          nationalIdType: values.guardianNationalIdType[0],
          nationalId: values.guardianNationalId,
          firstName: values.guardianFirstName,
          lastName: values.guardianLastName,
          phone: values.guardianPhone,
          gender: values.guardianGender[0],
          relation: values.guardianRelation[0],
        },
      }),
    );

    if (!kidSlice.error) {
      router.back();
    }
  };

  const kidGroupsSelect = kidGroupSlice.data
    ? kidGroupSlice.data.map((kidGroup) => {
        return {
          label: kidGroup.name,
          value: kidGroup.id,
        };
      })
    : [];

  return (
    <Layout>
      {kidGuardianSlice.loading || kidSlice.loading ? <LoadingMask /> : ''}
      <NavBarApp title="Crear Niño" />
      <AutoCenter>
        <label htmlFor="profileImage">
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
        </label>
        <input
          accept="image/*"
          id="profileImage"
          type="file"
          capture="environment"
          hidden={true}
          onChange={(e) => handleCapture(e.target)}
        />
      </AutoCenter>

      <Form
        form={form}
        onFinish={addNewKid}
        layout="horizontal"
        footer={
          <Button block type="submit" color="primary" size="large">
            Guardar
          </Button>
        }
      >
        <h3>Información Básica</h3>
        <Form.Item
          name="firstName"
          label="Nombre"
          rules={[{ required: true, message: 'Nombre es requerido' }]}
        >
          <Input placeholder="Escribir nombre..." />
        </Form.Item>
        <Form.Item
          name="lastName"
          label="Apellido"
          rules={[{ required: true, message: 'Apellido es requerido' }]}
        >
          <Input placeholder="Escribir apellido..." />
        </Form.Item>
        <Form.Item
          name="birthday"
          label="Fecha de nacimiento"
          trigger="onConfirm"
          onClick={(e, datePickerRef: RefObject<DatePickerRef>) => {
            datePickerRef.current?.open();
          }}
          rules={[
            { required: true, message: 'Fecha de nacimiento es requerida' },
          ]}
        >
          <DatePicker
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
                ? `${dayjs(value).format('YYYY-MM-DD')} (Tiene: ${Math.floor(
                    calculateAge(value) ?? 0,
                  )} años y ${
                    getAgeInMonths(value) - Math.floor(calculateAge(value)) * 12
                  } meses)`
                : 'Seleccionar fecha'
            }
          </DatePicker>
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
          />
        </Form.Item>
        <Form.Item
          name="guardianFirstName"
          label="Nombre"
          disabled={!!kidGuardianSlice.current}
          rules={[{ required: true, message: 'Nombre es requerido' }]}
        >
          <Input placeholder="Escribir nombre..." />
        </Form.Item>
        <Form.Item
          name="guardianLastName"
          label="Apellido"
          disabled={!!kidGuardianSlice.current}
          rules={[{ required: true, message: 'Apellido es requerido' }]}
        >
          <Input placeholder="Escribir apellido..." />
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
          ]}
        >
          <Input placeholder="Escribir telefono..." type="tel" />
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
          <Selector options={userGenderSelect} />
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
          <Selector options={kidRelationSelect} />
        </Form.Item>
        <Form.Item>
          {!!kidGuardianSlice.current ? (
            <Button block color="default" onClick={cleanGuardian} size="large">
              Limpiar formulario acudiente
            </Button>
          ) : null}
        </Form.Item>

        <h3>Información Adicional (Opcional)</h3>
        <Form.Item
          name="staticGroup"
          label="Asignar salón estático"
          childElementPosition="right"
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
            onMaskClick={() => {
              setVisibleMedicalCondition(false);
            }}
            position="top"
            destroyOnClose
          >
            <div>
              <SearchBar
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
            <div style={{ height: '300px', overflowY: 'scroll' }}>
              <CheckList
                style={{ '--border-top': '0', '--border-bottom': '0' }}
                defaultValue={medicalCondition ? [medicalCondition.id] : []}
                onChange={(val) => {
                  let medicalConditionSelected = kidMedicalConditionSlice.data
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
                      <CheckList.Item key={condition.id} value={condition.id}>
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
            </div>
          </Popup>
        </Form.Item>
        <Form.Item name="observations" label="Observaciones">
          <TextArea
            placeholder="Si seleccionó Otra condición describala aquí"
            maxLength={300}
            rows={2}
            showCount
          />
        </Form.Item>
      </Form>
    </Layout>
  );
};

export default NewKid;
