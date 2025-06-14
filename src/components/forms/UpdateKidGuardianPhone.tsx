/* eslint-disable @typescript-eslint/no-explicit-any */
import { useDispatch, useSelector } from 'react-redux';
import LoadingMask from '../LoadingMask';
import { useEffect, useState } from 'react';
import { Button, Divider, Form, Input, Popup, Selector, Typography } from 'react-vant';
import MobileInputApp, { checkPhoneField } from '../MobileInputApp';
import { IKidGuardian, kidRelationSelect } from '@/libs/models';
import { RootState, AppDispatch, UpdateKidGuardianPhone, GetKid } from '@/libs/state/redux';
import { capitalizeWords } from '@/libs/utils/text';
import { toast } from 'sonner';

type Props = {
  visible: boolean;
  onClose: (status: boolean) => void;
  kidGuardian: IKidGuardian;
};

const UpdateKidGuardianPhoneModal = ({ visible, onClose, kidGuardian }: Props) => {
  const [form] = Form.useForm();
  const { loading: guardianLoading, error } = useSelector(
    (state: RootState) => state.kidGuardianSlice,
  );
  const { current: kid } = useSelector((state: RootState) => state.kidSlice);
  const [kidRelationSelectFilter, setKidRelationSelectFilter] = useState(kidRelationSelect);

  useEffect(() => {
    if (kidRelationSelectFilter) {
      setKidRelationSelectFilter(
        kidRelationSelect.filter((kidRelation) => kidRelation.gender === kidGuardian.gender),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kidGuardian.gender]);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (error) {
      toast.error(`Ha ocurrido un error al actualizar el teléfono del acudiente: ${error}`, {
        duration: 5000,
        style: { color: 'white' },
      });
    }
  }, [error]);

  const closeModal = () => {
    onClose(false);
  };

  useEffect(() => {
    if (visible) {
      form.resetFields(['firstName', 'lastName', 'guardianPhone', 'guardianRelation']);
    }
  }, [form, visible]);

  const onFinish = async (values: any) => {
    if (kid?.id) {
      const guardianPhone = values.guardianPhone;
      const relation = values.guardianRelation[0];
      const kidGuardianId = kidGuardian.id;
      const kidId = kid.id;

      if (kidGuardianId) {
        const response = await dispatch(
          UpdateKidGuardianPhone({
            id: kidGuardianId,
            dialCodePhone: guardianPhone.prefix,
            phone: guardianPhone.value,
            relation,
            kidId,
          }),
        );

        if (!response.payload.error) {
          await dispatch(GetKid({ id: kidId }));
          await onClose(false);
        } else {
          toast.error(`El teléfono que intenta ingresar ya existe en la base de datos`, {
            duration: 5000,
            style: { color: 'white' },
          });
        }
      }
    }
  };

  return (
    <Popup
      closeable
      visible={visible}
      round
      onClose={closeModal}
      onClickOverlay={closeModal}
      style={{ height: '90%' }}
      position="bottom"
    >
      {guardianLoading ? <LoadingMask /> : ''}

      <div style={{ padding: 5 }}>
        <Typography.Title level={2} center>
          Actualizar Numero De teléfono y Relación con Niño
        </Typography.Title>
        <Form
          form={form}
          onFinish={onFinish}
          footer={
            <>
              <div style={{ paddingTop: 10 }}>
                <Button block nativeType="submit" type="primary" size="large">
                  Actualizar Acudiente
                </Button>
                {/* {IsSupervisorRegisterKidChurch() && (
                  <div style={{ paddingTop: 10, paddingBottom: 10 }}>
                    <Button
                      block
                      type="danger"
                      size="large"
                      onClick={() => showConfirmationModal('changeKidVolunteerModal')}
                    >
                      Eliminar Relación
                    </Button>
                  </div>
                )} */}
              </div>
            </>
          }
        >
          <Form.Item
            initialValue={capitalizeWords(kidGuardian.firstName)}
            name="firstName"
            label="Nombre"
            disabled
          >
            <Input placeholder="Nombre" />
          </Form.Item>
          <Form.Item
            initialValue={capitalizeWords(kidGuardian.lastName)}
            name="lastName"
            label="Apellido"
            disabled
          >
            <Input placeholder="Apellido" />
          </Form.Item>
          <Divider>Actualizar Datos</Divider>
          <Form.Item
            initialValue={{
              prefix: kidGuardian.dialCodePhone,
              value: kidGuardian.phone,
            }}
            name="guardianPhone"
            label="Teléfono"
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
            <MobileInputApp />
          </Form.Item>
          <Form.Item
            initialValue={[kidGuardian.relation]}
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
        </Form>
      </div>
    </Popup>
  );
};

export default UpdateKidGuardianPhoneModal;
