/* eslint-disable @typescript-eslint/no-explicit-any */
import { useDispatch, useSelector } from 'react-redux';
import LoadingMask from '../LoadingMask';
import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  Divider,
  Form,
  Input,
  Popup,
  Selector,
  Toast,
  Typography,
} from 'react-vant';
import { capitalizeWords } from '../../utils/text';
import {
  RootState,
  AppDispatch,
  UpdateKidGuardianPhone,
  GetKid,
} from '@faith-forge-web/state/redux';
import { IKidGuardian, kidRelationSelect } from '@faith-forge-web/models';
import MobileInputApp, { checkPhoneField } from '../MobileInputApp';
import { IsSupervisorRegisterKidChurch } from '../../utils/auth';

type Props = {
  visible: boolean;
  onClose: (status: boolean) => void;
  kidGuardian: IKidGuardian;
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
  const [kidRelationSelectFilter, setKidRelationSelectFilter] =
    useState(kidRelationSelect);

  useEffect(() => {
    if (kidRelationSelectFilter) {
      setKidRelationSelectFilter(
        kidRelationSelect.filter(
          (kidRelation) => kidRelation.gender === kidGuardian.gender,
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kidGuardian.gender]);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (error) {
      Toast.fail({
        message: `Ha ocurrido un error al actualizar el telefono del acudiente: ${error}`,
        position: 'bottom',
        duration: 5000,
      });
    }
  }, [error]);

  const closeModal = () => {
    onClose(false);
  };

  useEffect(() => {
    if (visible) {
      form.resetFields([
        'firstName',
        'lastName',
        'guardianPhone',
        'guardianRelation',
      ]);
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
          Toast.fail({
            message: `El Telefono que intenta ingresar ya existe en la base de datos`,
            position: 'bottom',
            duration: 5000,
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
          Actualizar Numero De Telefono y Relación con Niño
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
                      onClick={() =>
                        Dialog.confirm({
                          title: 'Eliminar la relación con el niño',
                          message: 'Desvincularas al niño de este acudiente',
                          confirmButtonText: 'Eliminar',
                          cancelButtonText: 'Cancelar',
                          onCancel: () => console.log('cancel'),
                          onConfirm: () => console.log('confirm'),
                        })
                      }
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
            label="Telefono"
            rules={[
              {
                required: true,
                message: 'Por favor digite el numero telefono del acudiente',
              },
              {
                required: true,
                message: 'El telefono debe tener minimo 7 digitos',
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
