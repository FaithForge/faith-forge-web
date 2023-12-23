import { Button, Form, Input, Popup, Selector, Toast } from 'antd-mobile';
import { AppDispatch, RootState } from '../../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import {
  UserGenderCode,
  idGuardianTypeSelect,
  userGenderSelect,
} from '../../models/User';
import LoadingMask from '../LoadingMask';
import { capitalizeWords } from '../../utils/text';
import { useEffect, useState } from 'react';
import { cleanCurrentKidGuardian } from '@/redux/slices/kid-church/kid-guardian.slice';
import {
  CreateKidGuardian,
  GetKidGuardian,
} from '@/redux/thunks/kid-church/kid-guardian.thunk';
import { GetKid } from '@/redux/thunks/kid-church/kid.thunk';
import { kidRelationSelect } from '@/models/KidChurch';

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
      Toast.show({
        icon: 'fail',
        content: `Ha ocurrido un error al crear el acudiente: ${error}`,
        position: 'bottom',
        duration: 5000,
      });
    }
  }, [error]);

  const closeModal = () => {
    onClose(false);
  };

  useEffect(() => {
    return () => {
      dispatch(cleanCurrentKidGuardian());
    };
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
      showCloseButton
      visible={visible}
      onClose={closeModal}
      onMaskClick={closeModal}
      bodyStyle={{
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        padding: 5,
      }}
    >
      {guardianLoading ? <LoadingMask /> : ''}
      <h1>Asignar acudiente</h1>
      <div
        style={{ overflowY: 'scroll', minHeight: '80vh', maxHeight: '80vh' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          footer={
            <Button block type="submit" color="primary" size="large">
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
            />
          </Form.Item>
          <Form.Item
            name="guardianFirstName"
            label="Nombre"
            disabled={!!guardian}
            rules={[{ required: true, message: 'Nombre es requerido' }]}
          >
            <Input placeholder="Escribir nombre..." />
          </Form.Item>
          <Form.Item
            name="guardianLastName"
            label="Apellido"
            disabled={!!guardian}
            rules={[{ required: true, message: 'Apellido es requerido' }]}
          >
            <Input placeholder="Escribir apellido..." />
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
            ]}
          >
            <Input placeholder="Escribir telefono..." type="tel" />
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
