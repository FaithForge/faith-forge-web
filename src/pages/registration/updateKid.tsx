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
import { userGenderSelect } from '../../models/Uset';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import LoadingMask from '../../components/LoadingMask';
import {
  GetKidGroups,
  GetKidMedicalConditions,
  UpdateKid,
  uploadKidPhoto,
} from '../../services/kidService';
import { loadingKidEnable } from '../../redux/slices/kidSlice';
import { useRouter } from 'next/router';
import { capitalizeWords } from '../../utils/text';
import { DateTime } from 'luxon';
import { calculateAge, getAgeInMonths } from '../../utils/date';
import { HealthSecurityEntitySelector } from '../../components/HealthSecurityEntitySelector';

const UpdateKidPage: NextPage = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const {
    current: kid,
    groups: kidGroups,
    loading: kidLoading,
    medicalConditions,
  } = useSelector((state: RootState) => state.kidSlice);

  const now = DateTime.local().endOf('year').toJSDate();

  const [source, setSource] = useState('');
  const [photo, setPhoto] = useState<any>(null);
  const [staticGroup, setStaticGroup] = useState(kid?.staticGroup as boolean);
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
    dispatch(GetKidGroups());
    dispatch(GetKidMedicalConditions());
  }, [dispatch]);

  useEffect(() => {
    if (!staticGroup) {
      form.resetFields(['kidGroup']);
    }
  }, [form, staticGroup]);

  useEffect(() => {
    if (kid) {
      form.setFieldsValue({
        firstName: capitalizeWords(kid.firstName),
        lastName: capitalizeWords(kid.lastName),
        birthday: new Date(kid.birthday),
        gender: kid.gender,
        staticGroup: kid.staticGroup,
        kidGroup: [kid.groupId],
        observations: kid.observations,
      });
      setStaticGroup(kid.staticGroup as boolean);
      setMedicalCondition({
        id: kid?.medicalCondition?.id ?? '',
        name: kid?.medicalCondition?.name ?? '',
      });
      setHealthSecurityEntity({
        id: kid?.healthSecurityEntity ?? '',
        name: kid?.healthSecurityEntity ?? '',
      });
    }
  }, [kid, form]);

  const [searchMedicalCondition, setSearchMedicalCondition] = useState('');
  const [visibleMedicalCondition, setVisibleMedicalCondition] = useState(false);
  const [medicalCondition, setMedicalCondition] = useState({
    id: kid?.medicalCondition?.id ?? '',
    name: kid?.medicalCondition?.name ?? '',
  });
  const filteredMedicalConditions = useMemo(() => {
    if (searchMedicalCondition) {
      return medicalConditions.filter((item) =>
        item.name
          .toLocaleLowerCase()
          .includes(searchMedicalCondition.toLocaleLowerCase()),
      );
    } else {
      return medicalConditions;
    }
  }, [medicalConditions, searchMedicalCondition]);

  const [healthSecurityEntity, setHealthSecurityEntity] = useState({
    id: '',
    name: '',
  });
  const checkHealthSecurityEntity = (
    _: any,
    value: { id: string; name: string },
  ) => {
    value = value ?? {
      id: kid?.healthSecurityEntity,
      name: kid?.healthSecurityEntity,
    };
    if (value.id) {
      setHealthSecurityEntity(value);
      return Promise.resolve();
    }
    return Promise.reject();
  };

  const updatedKid = async (values: any) => {
    dispatch(loadingKidEnable());

    let photoUrl = undefined;
    if (photo && photo !== kid?.photoUrl) {
      const formData = new FormData();
      formData.append('photo', photo);

      photoUrl = await uploadKidPhoto({ formData });
    }

    await dispatch(
      UpdateKid({
        kidRegistration: {
          id: kid?.id,
          firstName: values.firstName,
          lastName: values.lastName,
          birthday: values.birthday,
          gender: values.gender ? values.gender[0] : undefined,
          staticGroup: values.staticGroup ?? false,
          group: values.kidGroup ? values.kidGroup[0] : undefined,
          observations: values.observations ?? undefined,
          healthSecurityEntity:
            values.healthSecurityEntity?.name ?? kid?.healthSecurityEntity,
          photoUrl,
          medicalCondition: {
            id: medicalCondition.id ?? undefined,
          },
        },
      }),
    );
    router.back();
  };

  const kidGroupsSelect = kidGroups
    ? kidGroups.map((kidGroup) => {
        return {
          label: kidGroup.name,
          value: kidGroup.id,
        };
      })
    : [];

  return (
    <>
      {kidLoading ? <LoadingMask /> : ''}
      <NavBarApp title="Actualizar Niño" />
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
        onFinish={updatedKid}
        layout="horizontal"
        footer={
          <Button block type="submit" color="primary" size="large">
            Actualizar
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
          label="Genero"
          rules={[
            {
              required: true,
              message: 'Por favor seleccione el genero del niño',
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
          <p>Selecciona condicion medica</p>
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
            destroyOnClose
          >
            <div>
              <SearchBar
                placeholder="Buscar condición medica"
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
                  let medicalConditionSelected = medicalConditions.find(
                    (item) => item.id === val[0],
                  );
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
                        {condition.name}
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
        <Form.Item
          name="observations"
          label="Observaciones"
          help="Si selecciono Otra en enfermedades describala aqui o alguna condicion general que hay que tener en cuenta con el niño"
        >
          <TextArea
            placeholder="Escriba aqui su descripción"
            maxLength={300}
            rows={2}
            showCount
          />
        </Form.Item>
      </Form>
    </>
  );
};

export default UpdateKidPage;
