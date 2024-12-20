import { Button, Form, Input, Popup, Toast } from 'antd-mobile';
import { AppDispatch, RootState } from '../../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import LoadingMask from '../LoadingMask';
import { useEffect } from 'react';
import { UpdateKidGuardianPhone } from '@/redux/thunks/kid-church/kid-guardian.thunk';
import { GetKid } from '@/redux/thunks/kid-church/kid.thunk';
import { capitalizeWords } from '@/utils/text';
import { checkPhoneField } from '@/utils/validator';

type Props = {
  visible: boolean;
  onClose: any;
  kidGuardian: any;
};

const UpdateKidGuardianPhoneModal = ({
  visible,
  onClose,
  kidGuardian,
}: Props) => {
  const [form] = Form.useForm();
  const { loading: guardianLoading, error } = useSelector(
    (state: RootState) => state.kidGuardianSlice,
  );
  const { current: kid } = useSelector((state: RootState) => state.kidSlice);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (error) {
      Toast.show({
        icon: 'fail',
        content: `Ha ocurrido un error al actualizar el telefono del acudiente: ${error}`,
        position: 'bottom',
        duration: 5000,
      });
    }
  }, [error]);

  const closeModal = () => {
    onClose(false);
  };

  useEffect(() => {
    if (kidGuardian) {
      form.setFieldsValue({
        guardianPhone: kidGuardian.phone,
      });
    }
  }, [form, kidGuardian]);

  useEffect(() => {
    if (visible) {
      form.resetFields(['guardianPhone']);
    }
  }, [form, visible]);

  const onFinish = async (values: any) => {
    if (kid?.id) {
      const guardianPhone = values.guardianPhone;
      const kidGuardianId = kidGuardian.id;
      const kidId = kid.id;

      if (kidGuardianId) {
        const response = await dispatch(
          UpdateKidGuardianPhone({
            id: kidGuardianId,
            phone: guardianPhone,
          }),
        );

        if (!response.payload.error) {
          await dispatch(GetKid({ id: kidId }));
          await onClose(false);
        } else {
          Toast.show({
            icon: 'fail',
            content: `El Telefono que intenta ingresar ya existe en la base de datos`,
            position: 'bottom',
            duration: 5000,
          });
        }
      }
    }
  };

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
      <h1>Actualizar Nuevo De Telefono</h1>
      <h3>
        Acudiente: {capitalizeWords(kidGuardian.firstName)}{' '}
        {capitalizeWords(kidGuardian.lastName)}
      </h3>
      <div
        style={{ overflowY: 'scroll', minHeight: '40vh', maxHeight: '40vh' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          footer={
            <Button block type="submit" color="primary" size="large">
              Actualizar Telefono
            </Button>
          }
        >
          <Form.Item
            name="guardianPhone"
            label="Telefono"
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
              defaultValue={kidGuardian.phone}
              autoComplete="false"
            />
          </Form.Item>
        </Form>
      </div>
    </Popup>
  );
};

export default UpdateKidGuardianPhoneModal;
