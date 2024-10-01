/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import NavBarApp from '../../components/NavBarApp';
// import { RefObject } from 'react';
import dayjs from 'dayjs';
import { userGenderSelect } from '../../models/User';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import LoadingMask from '../../components/LoadingMask';
import { useRouter } from 'next/router';
import { capitalizeWords } from '../../utils/text';
import { DateTime } from 'luxon';
// import {
//   calculateAge,
//   getAgeInMonths,
//   labelRendererCalendar,
// } from '../../utils/date';
import { HealthSecurityEntitySelector } from '../../components/HealthSecurityEntitySelector';
import { GetKidGroups } from '@/redux/thunks/kid-church/kid-group.thunk';
import { GetKidMedicalConditions } from '@/redux/thunks/kid-church/kid-medical-condition.thunk';
import { loadingKidEnable } from '@/redux/slices/kid-church/kid.slice';
import { UpdateKid } from '@/redux/thunks/kid-church/kid.thunk';
import { Layout } from '@/components/Layout';
import { UploadUserImage } from '@/redux/thunks/user/user.thunk';
import { checkLastNameField } from '@/utils/validator';
import {
  Button,
  Form,
  Image,
  Input,
  Popup,
  Search,
  Selector,
  Space,
  Switch,
} from 'react-vant';

const UpdateKidPage: NextPage = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const kidSlice = useSelector((state: RootState) => state.kidSlice);
  const kidGroupSlice = useSelector((state: RootState) => state.kidGroupSlice);
  const kidMedicalConditionSlice = useSelector(
    (state: RootState) => state.kidMedicalConditionSlice,
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const now = DateTime.local().endOf('year').toJSDate();

  const [source, setSource] = useState(kidSlice.current?.photoUrl);
  const [photo, setPhoto] = useState<any>(null);
  const [staticGroup, setStaticGroup] = useState(
    kidSlice.current?.staticGroup as boolean,
  );
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
    if (kidSlice.current) {
      form.setFieldsValue({
        firstName: capitalizeWords(kidSlice.current.firstName ?? ''),
        lastName: capitalizeWords(kidSlice.current.lastName ?? ''),
        birthday: dayjs(kidSlice.current.birthday?.toString()).toDate(),
        gender: kidSlice.current.gender,
        staticGroup: kidSlice.current.staticGroup,
        kidGroup: [kidSlice.current.kidGroup?.id],
        observations: kidSlice.current.observations,
      });
      setStaticGroup(kidSlice.current.staticGroup as boolean);
      setMedicalCondition({
        id: kidSlice.current?.medicalCondition?.id ?? '',
        name: kidSlice.current?.medicalCondition?.name ?? '',
      });
      setHealthSecurityEntity({
        id: kidSlice.current?.healthSecurityEntity ?? '',
        name: kidSlice.current?.healthSecurityEntity ?? '',
      });
    }
  }, [form, kidSlice]);

  const [searchMedicalCondition, setSearchMedicalCondition] = useState('');
  const [visibleMedicalCondition, setVisibleMedicalCondition] = useState(false);
  const [medicalCondition, setMedicalCondition] = useState({
    id: kidSlice.current?.medicalCondition?.id ?? '',
    name: kidSlice.current?.medicalCondition?.name ?? '',
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    value = value ?? {
      id: kidSlice.current?.healthSecurityEntity,
      name: kidSlice.current?.healthSecurityEntity,
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
    if (photo && photo !== kidSlice.current?.photoUrl) {
      const formData = new FormData();
      formData.append('file', photo);

      photoUrl = (await dispatch(UploadUserImage({ formData })))
        .payload as string;
    }

    if (kidSlice.current?.id) {
      await dispatch(
        UpdateKid({
          id: kidSlice.current.id,
          updateKid: {
            firstName: values.firstName,
            lastName: values.lastName,
            birthday: values.birthday,
            gender: values.gender ? values.gender[0] : undefined,
            staticGroup: values.staticGroup ?? false,
            staticKidGroupId: values.kidGroup ? values.kidGroup[0] : undefined,
            observations: values.observations ?? undefined,
            photoUrl,
            healthSecurityEntity:
              values.healthSecurityEntity?.name ??
              kidSlice.current?.healthSecurityEntity,
            medicalConditionId:
              medicalCondition.id !== '' ? medicalCondition.id : undefined,
          },
        }),
      );
    }
    router.back();
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
      {kidSlice.loading ? <LoadingMask /> : ''}
      <NavBarApp title="Actualizar Niño" />
      {/* <AutoCenter> */}
      <label htmlFor="profileImage">
        {/* {source ? (
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
        )} */}
      </label>
      <input
        accept="image/*"
        id="profileImage"
        type="file"
        capture="environment"
        hidden={true}
        onChange={(e) => handleCapture(e.target)}
      />
      {/* </AutoCenter> */}

      <Form
        form={form}
        onFinish={updatedKid}
        layout="horizontal"
        footer={
          <Button block type="primary" size="large">
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
                ? `${dayjs(value).format('YYYY-MM-DD')} (Tiene: ${Math.floor(
                    calculateAge(value) ?? 0,
                  )} años y ${
                    getAgeInMonths(value) - Math.floor(calculateAge(value)) * 12
                  } meses)`
                : 'Seleccionar fecha'
            }
          </DatePicker> */}
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
            onClickOverlay={() => {
              setVisibleMedicalCondition(false);
            }}
            destroyOnClose
          >
            <div>
              <Search
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
            {/* <div style={{ height: '300px', overflowY: 'scroll' }}>
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
            </div> */}
          </Popup>
        </Form.Item>
        <Form.Item
          name="observations"
          label="Observaciones"
          // help="Si selecciono Otra en enfermedades describala aqui o alguna condicion general que hay que tener en cuenta con el niño"
        >
          <Input.TextArea
            placeholder="Escriba aqui su descripción"
            maxLength={300}
            rows={2}
            showWordLimit
          />
        </Form.Item>
      </Form>
    </Layout>
  );
};

export default UpdateKidPage;
