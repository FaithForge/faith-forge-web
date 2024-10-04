/* eslint-disable no-extra-boolean-cast */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useDispatch, useSelector } from 'react-redux';
import LoadingMask from '../LoadingMask';
import { capitalizeWords } from '../../utils/text';
import { useEffect, useState } from 'react';
import { Button, Form, Input, Popup, Selector, Toast } from 'react-vant';
import { checkPhoneField } from '../../utils/validator';
import {
  RootState,
  AppDispatch,
  cleanCurrentKidGuardian,
  CreateKidGuardian,
  GetKid,
  GetKidGuardian,
} from '@faith-forge-web/state/redux';
import {
  UserGenderCode,
  kidRelationSelect,
  idGuardianTypeSelect,
  userGenderSelect,
} from '@faith-forge-web/models';

type Props = {
  visible: boolean;
  onClose: any;
};

const CreateNewKidGuardian = ({ visible, onClose }: Props) => {
  const [form] = Form.useForm();
  const {
    current: guardian,
    loading: guardianLoading,
    error,
  } = useSelector((state: RootState) => state.kidGuardianSlice);
  const { current: kid } = useSelector((state: RootState) => state.kidSlice);
  const [selectedGender, setSelectedGender] = useState<UserGenderCode>();
  const [kidRelationSelectFilter, setKidRelationSelectFilter] =
    useState(kidRelationSelect);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (error) {
      Toast.fail({
        message: `Ha ocurrido un error al crear el acudiente: ${error}`,
        position: 'bottom',
        duration: 5000,
      });
    }
  }, [error]);

  const closeModal = () => {
    onClose(false);
  };

  useEffect(() => {
    dispatch(cleanCurrentKidGuardian());
  }, []);

  useEffect(() => {
    if (guardian) {
      form.setFieldsValue({
        guardianNationalIdType: [guardian.nationalIdType],
        guardianNationalId: guardian.nationalId,
        guardianFirstName: capitalizeWords(guardian.firstName),
        guardianLastName: capitalizeWords(guardian.lastName),
        guardianPhone: guardian.phone,
        guardianGender: [guardian.gender],
        guardianRelation: [guardian.relation],
      });
      setSelectedGender(guardian.gender);
    }
  }, [guardian, form]);

  useEffect(() => {
    if (visible) {
      form.resetFields([
        'guardianNationalIdType',
        'guardianNationalId',
        'guardianFirstName',
        'guardianLastName',
        'guardianPhone',
        'guardianGender',
        'guardianRelation',
      ]);
    }
  }, [form, visible]);

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

  const findGuardian = async () => {
    const guardianNationalId = form.getFieldsValue().guardianNationalId;
    dispatch(GetKidGuardian(guardianNationalId));
  };

  const onFinish = async (values: any) => {
    if (kid?.id) {
      const nationalIdType = values.guardianNationalIdType[0];
      const nationalId = values.guardianNationalId;
      const firstName = values.guardianFirstName;
      const lastName = values.guardianLastName;
      const phone = values.guardianPhone;
      const gender = values.guardianGender[0];
      const relation = values.guardianRelation[0];
      const kidId = kid.id;

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
        await dispatch(GetKid({ id: kidId }));
        await onClose(false);
      }
    }
  };

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

  return (
    <Popup
      closeable
      visible={visible}
      onClose={closeModal}
      onClickOverlay={closeModal}
      style={{ height: '90%' }}
      position="bottom"
      round
    >
      {guardianLoading ? <LoadingMask /> : ''}
      <div
        style={{
          padding: 5,
        }}
      >
        <h1>Asignar acudiente</h1>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          footer={
            <Button block type="primary" size="large">
              Asignar
            </Button>
          }
        >
          <Form.Item
            name="guardianNationalIdType"
            label="Tipo de documento"
            disabled={!!guardian}
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
            label="Numero de documento"
            disabled={!!guardian}
            rules={[
              { required: true, message: 'Numero de documento es requerido' },
            ]}
          >
            <Input
              placeholder="Escribir numero de documento..."
              onBlur={findGuardian}
              autoComplete="false"
            />
          </Form.Item>
          <Form.Item
            name="guardianFirstName"
            label="Nombre"
            disabled={!!guardian}
            rules={[{ required: true, message: 'Nombre es requerido' }]}
          >
            <Input placeholder="Escribir nombre..." autoComplete="false" />
          </Form.Item>
          <Form.Item
            name="guardianLastName"
            label="Apellido"
            disabled={!!guardian}
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
            label="Telefono"
            disabled={!!guardian}
            rules={[
              {
                required: true,
                message: 'Por favor digite el numero telefono del acudiente',
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
            label="Genero"
            disabled={!!guardian}
            rules={[
              {
                required: true,
                message: 'Por favor seleccione el genero del acudiente',
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
            {!!guardian ? (
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
      </div>
    </Popup>
  );
};

export default CreateNewKidGuardian;
