/* eslint-disable @typescript-eslint/no-explicit-any */
import { useDispatch, useSelector } from 'react-redux';
import LoadingMask from '../LoadingMask';
import { useEffect, useState } from 'react';
import { Button, Form, Input, Popup, Selector } from 'react-vant';
import MobileInputApp, { checkPhoneField } from '../MobileInputApp';
import NationalIdTypeInputApp from '../NationalIdTypeInputApp';
import { MdKeyboardArrowRight } from 'react-icons/md';
import { capitalizeWords } from '@/libs/utils/text';
import {
  RootState,
  AppDispatch,
  cleanCurrentKidGuardian,
  GetKidGuardian,
  CreateKidGuardian,
  GetKid,
} from '@/libs/state/redux';
import {
  ID_TYPE_CODE_MAPPER,
  IdType,
  kidRelationSelect,
  UserGenderCode,
  userGenderSelect,
  UserIdType,
} from '@/libs/models';
import { toast } from 'sonner';

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
  const [kidRelationSelectFilter, setKidRelationSelectFilter] = useState(kidRelationSelect);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (error) {
      toast.error(`Ha ocurrido un error al crear el acudiente: ${error}`, {
        duration: 5000,
        style: {
          color: 'white',
        },
      });
    }
  }, [error]);

  const closeModal = () => {
    onClose(false);
  };

  useEffect(() => {
    dispatch(cleanCurrentKidGuardian());
  }, [dispatch]);

  useEffect(() => {
    if (guardian) {
      console.log(guardian);
      form.setFieldsValue({
        guardianNationalIdType: {
          value: guardian.nationalIdType,
          label: ID_TYPE_CODE_MAPPER[guardian.nationalIdType],
        },
        guardianNationalId: guardian.nationalId,
        guardianFirstName: capitalizeWords(guardian.firstName),
        guardianLastName: capitalizeWords(guardian.lastName),
        guardianPhone: {
          prefix: guardian.dialCodePhone,
          value: guardian.phone,
        },
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
    if (guardianNationalId) dispatch(GetKidGuardian(guardianNationalId));
  };

  const onFinish = async (values: any) => {
    if (kid?.id) {
      const nationalIdType = values.guardianNationalIdType.value;
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
          dialCodePhone: phone.prefix,
          phone: phone.value,
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
      filter = kidRelationSelect.filter((kidRelation) => kidRelation.gender === selectedGender);
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
        <h2 className="text-2xl font-bold text-center py-2">Asignar acudiente</h2>
        <Form
          form={form}
          onFinish={onFinish}
          footer={
            <Button block type="primary" size="large" nativeType="submit">
              Asignar
            </Button>
          }
        >
          <Form.Item
            initialValue={{ label: IdType.CC, value: UserIdType.CC }}
            name="guardianNationalIdType"
            label="Tipo de documento"
            disabled={!!guardian}
            rightIcon={<MdKeyboardArrowRight size={24} />}
            rules={[
              {
                required: true,
                message: 'Por favor seleccione un tipo de documento',
              },
            ]}
          >
            <NationalIdTypeInputApp disabled={!!guardian} />
          </Form.Item>

          <Form.Item
            name="guardianNationalId"
            label="Numero de documento"
            disabled={!!guardian}
            rules={[{ required: true, message: 'Numero de documento es requerido' }]}
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
            label="Teléfono"
            disabled={!!guardian}
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
            <MobileInputApp disabled={!!guardian} />
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

          {!!guardian ? (
            <Form.Item>
              <Button block type="default" onClick={cleanGuardian} size="large">
                Limpiar formulario acudiente
              </Button>
            </Form.Item>
          ) : null}
        </Form>
      </div>
    </Popup>
  );
};

export default CreateNewKidGuardian;
