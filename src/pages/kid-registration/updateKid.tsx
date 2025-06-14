/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import LoadingMask from '../../components/LoadingMask';
import { useRouter } from 'next/router';
import { DateTime } from 'luxon';
import {
  Button,
  DatetimePicker,
  Form,
  Image,
  Input,
  Selector,
  Switch,
  Typography,
} from 'react-vant';
import { Layout } from '../../components/Layout';

import { TbCameraPlus } from 'react-icons/tb';
import { ModalSelectorApp } from '../../components/ModalSelectorApp';
import { ModalCheckerApp } from '../../components/ModalCheckerApp';
import { IKidGroup, userGenderSelect, healthSecurityEntitySelect } from '@/libs/models';
import {
  RootState,
  AppDispatch,
  GetKidGroups,
  GetKidMedicalConditions,
  loadingKidEnable,
  UploadUserImage,
  UpdateKid,
} from '@/libs/state/redux';
import { calculateAge, getAgeInMonths } from '@/libs/utils/date';
import { resizeAndCropImageToSquare } from '@/libs/utils/image';
import { capitalizeWords } from '@/libs/utils/text';
import { checkLastNameField } from '@/libs/utils/validator';
import BackNavBar from '@/components/navbar/BackNavBar';

const UpdateKidPage: NextPage = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const kidSlice = useSelector((state: RootState) => state.kidSlice);
  const kidGroupSlice = useSelector((state: RootState) => state.kidGroupSlice);
  const kidMedicalConditionSlice = useSelector(
    (state: RootState) => state.kidMedicalConditionSlice,
  );
  const now = DateTime.local().endOf('year').toJSDate();

  const dispatch = useDispatch<AppDispatch>();

  //useState
  const [medicalCondition, setMedicalCondition] = useState({
    id: kidSlice.current?.medicalCondition?.id ?? '',
    name: kidSlice.current?.medicalCondition?.name ?? '',
  });
  const [healthSecurityEntity, setHealthSecurityEntity] = useState({
    id: kidSlice.current?.healthSecurityEntity ?? '',
    name: kidSlice.current?.healthSecurityEntity ?? '',
  });
  const [source, setSource] = useState(kidSlice.current?.photoUrl);
  const [photo, setPhoto] = useState<Blob>();
  const [staticGroup, setStaticGroup] = useState(kidSlice.current?.staticGroup as boolean);

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
    dispatch(GetKidGroups({}));
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
        healthSecurityEntity: healthSecurityEntity,
        medicalCondition: medicalCondition,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, kidSlice]);

  const checkHealthSecurityEntity = (_: any, value: { id: string; name: string }) => {
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
    if (photo && source !== kidSlice.current?.photoUrl) {
      const formData = new FormData();
      formData.append('file', photo);

      photoUrl = (await dispatch(UploadUserImage({ formData }))).payload as string;
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
              values.healthSecurityEntity?.name ?? kidSlice.current?.healthSecurityEntity,
            medicalConditionId: medicalCondition.id !== '' ? medicalCondition.id : undefined,
          },
        }),
      );
    }
    router.back();
  };

  const kidGroupsSelect = kidGroupSlice.data
    ? kidGroupSlice.data.map((kidGroup: IKidGroup) => {
        return {
          label: kidGroup.name,
          value: kidGroup.id,
        };
      })
    : [];

  return (
    <Layout>
      {kidSlice.loading ? <LoadingMask /> : ''}
      <BackNavBar title="Actualizar Niño" />
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
        <input
          accept="image/*"
          id="profileImage"
          type="file"
          capture="environment"
          hidden={true}
          onChange={(e) => handleCapture(e.target)}
        />
      </div>

      <Form
        form={form}
        onFinish={updatedKid}
        layout="horizontal"
        footer={
          <Form.Item style={{ paddingBottom: 20 }}>
            <Button type="primary" nativeType="submit" size="large">
              Actualizar
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
                  )} años y ${getAgeInMonths(value) - Math.floor(calculateAge(value)) * 12} meses)`
                : 'Seleccionar fecha'
            }
          </DatetimePicker>
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
          <ModalSelectorApp
            options={healthSecurityEntitySelect}
            placeholder="Buscar EPS"
            value={healthSecurityEntity}
            onChange={setHealthSecurityEntity}
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
