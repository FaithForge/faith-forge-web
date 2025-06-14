/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useDispatch, useSelector } from 'react-redux';

import { useRouter } from 'next/router';
import { PiUserSwitchFill } from 'react-icons/pi';

import { Button, Form, Input, NoticeBar, Radio, Cell, Typography, Skeleton } from 'react-vant';
import UpdateKidGuardianPhoneModal from './forms/UpdateKidGuardianPhone';
import { AiFillEdit } from 'react-icons/ai';
import { LiaBirthdayCakeSolid } from 'react-icons/lia';
import TagKidGroupApp from './TagKidGroupApp';
import {
  IKidGuardian,
  KidGroupType,
  UserGenderCode,
  USER_GENDER_CODE_MAPPER,
  KID_RELATION_CODE_MAPPER,
  KidGuardianRelationCodeEnum,
} from '@/libs/models';
import {
  AppDispatch,
  RootState,
  GetKid,
  GetKidGroups,
  CreateKidRegistration,
  RemoveKidRegistration,
  ReprintKidRegistration,
} from '@/libs/state/redux';
import { GetUserRoles, IsSupervisorRegisterKidChurch } from '@/libs/utils/auth';
import { FFDay } from '@/libs/utils/ffDay';
import { capitalizeWords } from '@/libs/utils/text';
import { toast } from 'sonner';
import ConfirmationModal, { showConfirmationModal } from './modal/ConfirmationModal';
import { ColorType } from '@/libs/common-types/constants/theme';

const KidRegistrationView = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [action, setAction] = useState<string>();
  const roles = GetUserRoles();
  const [openUpdateKidGuardianPhoneModal, setOpenUpdateKidGuardianPhoneModal] = useState(false);
  const [kidGuardianToUpdate, setKidGuardianToUpdate] = useState<IKidGuardian | undefined>();
  const kidGroupSlice = useSelector((state: RootState) => state.kidGroupSlice);
  const [isKidVolunteer, setIsKidVolunteer] = useState(false);

  const kidSlice = useSelector((state: RootState) => state.kidSlice);
  const kidRegistrationSlice = useSelector((state: RootState) => state.kidRegistrationSlice);

  const { current: churchMeeting } = useSelector((state: RootState) => state.churchMeetingSlice);

  useEffect(() => {
    if (kidSlice.current?.id) {
      dispatch(GetKid({ id: kidSlice.current.id }));
      dispatch(GetKidGroups({ type: KidGroupType.SPECIAL }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, kidSlice.current?.id]);

  const registerKid = async (values: any) => {
    setAction('register');
    const kidGuardianId = values.guardian;
    const observation = values.observations;

    if (kidSlice.current?.id && kidSlice.current.kidGroup?.id) {
      await dispatch(
        CreateKidRegistration({
          kidId: kidSlice.current.id,
          kidGroupId: isKidVolunteer ? kidGroupSlice.data[0].id : kidSlice.current.kidGroup?.id,
          kidGuardianId,
          observation,
        }),
      );
      toast.success('Se ha registrado al niño con exito', {
        duration: 1000,
        style: { color: 'white' },
      });
      router.back();
    }
  };

  const removeKidRegistration = async () => {
    setAction('remove');
    if (kidSlice.current?.currentKidRegistration?.id) {
      await dispatch(
        RemoveKidRegistration({
          id: kidSlice.current.currentKidRegistration.id,
        }),
      );
      toast.success('Se ha eliminado el registro del niño con exito', {
        duration: 1000,
        style: { color: 'white' },
      });
      router.back();
    }
  };

  const reprintRegisterLabelKid = async (copies: number) => {
    setAction('reprint');
    if (kidSlice.current?.currentKidRegistration?.id) {
      await dispatch(
        ReprintKidRegistration({
          id: kidSlice.current.currentKidRegistration.id,
          copies,
        }),
      );
      router.back();
    }
  };

  const kidGuardianRegistration = kidSlice.current?.relations?.length
    ? kidSlice.current?.relations?.find(
        (kidGuardian: IKidGuardian) =>
          kidGuardian.id === kidSlice.current?.currentKidRegistration?.guardianId,
      )
    : null;

  const birthday = kidSlice.current?.birthday
    ? FFDay(new Date(kidSlice.current.birthday)).tz('UTC').locale('es').format('MMMM D, YYYY')
    : '';

  const imageProfile = kidSlice.current?.photoUrl
    ? kidSlice.current.photoUrl
    : kidSlice.current?.gender === UserGenderCode.MALE
      ? '/icons/boy-v2.png'
      : '/icons/girl-v2.png';

  return (
    <div style={{ paddingLeft: 15, paddingRight: 15 }}>
      <div className="flex justify-center items-center gap-4 pb-2.5">
        {/* Imagen */}
        <div className="w-1/3">
          <img
            alt="profileImage"
            src={imageProfile}
            className="object-cover rounded-full mt-2.5 mb-2.5"
            // onClick={() =>
            //   ImagePreview.open({
            //     closeable: true,
            //     showIndex: false,
            //     images: [imageProfile],
            //   })
            // }
          />
        </div>

        {/* Nombre + Grupo */}
        <div className="w-2/3">
          <h1 className="text-[28px] mt-[5px] mb-0">
            {capitalizeWords(kidSlice.current?.firstName ?? '')}
          </h1>
          <h2 className="text-[20px] mt-0 mb-[5px]">
            {capitalizeWords(kidSlice.current?.lastName ?? '')}
          </h2>

          {!kidSlice.current?.kidGroup ? (
            <Skeleton row={1} rowWidth={120} rowHeight={25} style={{ padding: 0 }} />
          ) : kidSlice.current?.currentKidRegistration ? (
            <TagKidGroupApp
              kidGroup={
                kidSlice.current?.currentKidRegistration.groupId !== kidSlice.current.kidGroup.id
                  ? 'Yo Soy Iglekids'
                  : kidSlice.current.kidGroup.name
              }
              staticGroup={
                kidSlice.current?.currentKidRegistration.groupId !== kidSlice.current.kidGroup.id
                  ? false
                  : kidSlice.current.staticGroup
              }
            />
          ) : (
            <div className="flex items-end">
              <TagKidGroupApp
                kidGroup={
                  isKidVolunteer ? kidGroupSlice.data[0].name : kidSlice.current.kidGroup.name
                }
                staticGroup={isKidVolunteer ? false : kidSlice.current.staticGroup}
              />
              <PiUserSwitchFill
                size={24}
                className="pl-2 align-bottom cursor-pointer"
                onClick={() => showConfirmationModal('changeKidVolunteerModal')}
              />
            </div>
          )}
        </div>
      </div>
      {birthday.slice(0, -6) === dayjs(new Date()).locale('es').format('MMMM D') && (
        <NoticeBar
          text="¡¡¡HOY ES SU CUMPLEAÑOS!!!"
          background="rgb(249, 249, 249)"
          leftIcon={<LiaBirthdayCakeSolid />}
          style={{ marginBottom: '10px', textAlign: 'center' }}
        />
      )}
      <div className="card card-dash bg-gray-50 w-full mb-4">
        <div className="card-body">
          <h2 className="card-title">Datos del niño</h2>
          <div className="flex flex-col gap-y-4">
            {kidSlice.current?.faithForgeId && (
              <div className="flex gap-x-4">
                <div className="w-1/2 font-bold">Código de aplicación</div>
                <div className="w-1/2">{kidSlice.current?.faithForgeId}</div>
              </div>
            )}

            {(kidSlice.current?.age || kidSlice.current?.age === 0) &&
              kidSlice.current?.ageInMonths && (
                <div className="flex gap-x-4">
                  <div className="w-1/2 font-bold">Edad</div>
                  <div className="w-1/2">
                    {`${Math.floor(kidSlice.current?.age ?? 0)} años y ${
                      kidSlice.current.ageInMonths - Math.floor(kidSlice.current.age) * 12
                    } meses`}
                  </div>
                </div>
              )}

            {kidSlice.current?.birthday && (
              <div className="flex gap-x-4">
                <div className="w-1/2 font-bold">Fecha de nacimiento</div>
                <div className="w-1/2">{`${birthday}`}</div>
              </div>
            )}

            {kidSlice.current?.gender && (
              <div className="flex gap-x-4">
                <div className="w-1/2 font-bold">Género</div>
                <div className="w-1/2">
                  {USER_GENDER_CODE_MAPPER[kidSlice.current.gender as any as UserGenderCode]}
                </div>
              </div>
            )}

            {kidSlice.loading && !kidSlice.current?.healthSecurityEntity ? (
              <div className="w-full pl-0 pb-2.5">
                <Skeleton row={1} rowHeight={25} style={{ width: '100%' }} />
              </div>
            ) : (
              kidSlice.current?.healthSecurityEntity && (
                <div className="flex gap-x-4">
                  <div className="w-1/2 font-bold">EPS</div>
                  <div className="w-1/2">{kidSlice.current.healthSecurityEntity}</div>
                </div>
              )
            )}

            {kidSlice.loading && !kidSlice.current?.medicalCondition ? (
              <div className="w-full pl-0 pb-2.5">
                <Skeleton row={1} rowHeight={25} style={{ width: '100%' }} />
              </div>
            ) : (
              kidSlice.current?.medicalCondition && (
                <div className="flex gap-x-4">
                  <div className="w-1/2 font-bold">Condición Médica</div>
                  <div className="w-1/2">
                    {`${kidSlice.current.medicalCondition?.code} - ${kidSlice.current.medicalCondition?.name}`}
                  </div>
                </div>
              )
            )}

            {kidSlice.loading && !kidSlice.current?.observations ? (
              <div className="w-full pl-0 pb-2.5">
                <Skeleton row={1} rowHeight={25} style={{ width: '100%' }} />
              </div>
            ) : (
              kidSlice.current?.observations && (
                <div className="flex gap-x-4">
                  <div className="w-1/2 font-bold">Observaciones generales</div>
                  <div className="w-1/2">{kidSlice.current.observations}</div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {!kidSlice.current?.currentKidRegistration ? (
        <Form
          form={form}
          layout="vertical"
          onFinish={registerKid}
          footer={
            <>
              <Typography.Text
                center={true}
                style={{ width: '100%', paddingTop: 5, paddingBottom: 5 }}
              >
                El registro sera para: {churchMeeting?.name}
              </Typography.Text>
              <Button
                loading={kidRegistrationSlice.loading && action === 'reprint'}
                loadingText="Registrando..."
                disabled={kidRegistrationSlice.loading}
                block
                nativeType="submit"
                type="primary"
                size="large"
                style={{ paddingTop: 5, paddingBottom: 5 }}
              >
                Registrar
              </Button>
            </>
          }
        >
          <Form.Item
            name="guardian"
            label="Seleccionar acudiente"
            rules={[
              {
                required: true,
                message: 'Por favor seleccione un acudiente',
              },
            ]}
          >
            {!kidSlice.current?.relations ? (
              <Skeleton row={3} style={{ width: '100%' }} />
            ) : (
              <Radio.Group value={form.getFieldValue('guardian')} style={{ width: '100%' }}>
                <Cell.Group border={false}>
                  {kidSlice.current.relations.map((kidGuardian: IKidGuardian) => {
                    return (
                      <Cell
                        key={kidGuardian.id}
                        clickable
                        title={`${capitalizeWords(kidGuardian.firstName)} ${capitalizeWords(
                          kidGuardian.lastName as '',
                        )} (${KID_RELATION_CODE_MAPPER[kidGuardian.relation]})`}
                        label={`Teléfono: ${kidGuardian.dialCodePhone} ${kidGuardian.phone}`}
                        onClick={() => form.setFieldValue('guardian', kidGuardian.id)}
                        icon={<Radio name={kidGuardian.id} />}
                        rightIcon={
                          <AiFillEdit
                            style={{ width: 24, height: 24 }}
                            onClick={() => {
                              const kidGuardianSearch = kidSlice.current?.relations?.find(
                                (item) => item.id === kidGuardian.id,
                              );
                              if (kidGuardianSearch) {
                                setKidGuardianToUpdate(kidGuardianSearch);
                                setOpenUpdateKidGuardianPhoneModal(true);
                              }
                            }}
                          />
                        }
                        style={{
                          paddingLeft: 0,
                          paddingRight: 0,
                          paddingTop: 5,
                          paddingBottom: 5,
                          alignItems: 'center',
                        }}
                      />
                    );
                  })}
                </Cell.Group>
              </Radio.Group>
            )}
          </Form.Item>

          <Form.Item name="observations" label="Observaciones al registrar">
            <Input.TextArea
              placeholder="Ejemplo: lleva bolso, lleva merienda, está enfermo de algo en el momento."
              maxLength={300}
              rows={2}
              showWordLimit
            />
          </Form.Item>
        </Form>
      ) : (
        <>
          <div className="card card-dash bg-gray-50 w-full mb-4">
            <div className="card-body">
              <h2 className="card-title">Información del registro</h2>
              <div className="flex flex-col gap-y-4">
                <div className="flex gap-x-4">
                  <div className="w-1/2 font-bold">Fecha de registro</div>
                  <div className="w-1/2">
                    {`${dayjs(kidSlice.current?.currentKidRegistration?.date.toString())
                      .locale('es')
                      .format('MMMM D, YYYY h:mm A')}`}
                  </div>
                </div>

                {kidGuardianRegistration && (
                  <div className="flex gap-x-4">
                    <div className="w-1/2 font-bold">Acudiente que registró</div>
                    <div className="w-1/2">
                      {`${capitalizeWords(kidGuardianRegistration.firstName)} ${capitalizeWords(
                        kidGuardianRegistration.lastName as '',
                      )} (${KID_RELATION_CODE_MAPPER[kidGuardianRegistration.relation]}) - Teléfono: ${kidGuardianRegistration.dialCodePhone} ${kidGuardianRegistration.phone}`}
                    </div>
                  </div>
                )}

                {kidSlice.current?.currentKidRegistration?.observation && (
                  <div className="flex gap-x-4">
                    <div className="w-1/2 font-bold">Observaciones al registrar</div>
                    <div className="w-1/2">
                      {`${kidSlice.current.currentKidRegistration?.observation}`}
                    </div>
                  </div>
                )}

                {IsSupervisorRegisterKidChurch(roles) &&
                  kidSlice.current?.currentKidRegistration?.log && (
                    <div className="flex gap-x-4">
                      <div className="w-1/2 font-bold">Log de registro</div>
                      <div className="w-1/2">
                        {`${kidSlice.current.currentKidRegistration?.log}`}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
          <div className="card card-dash bg-gray-50 w-full mb-4">
            <div className="card-body">
              <h2 className="card-title">Acudientes</h2>
              <div className="grid grid-cols-24 gap-2">
                {/* Encabezados */}
                <div className="col-span-10 font-bold">Nombre</div>
                <div className="col-span-5 font-bold">Relación</div>
                <div className="col-span-9 font-bold">Teléfono</div>

                {/* Contenido */}
                {kidSlice.current.relations?.map((kidGuardian: IKidGuardian, index) => (
                  <React.Fragment key={index}>
                    <div className="col-span-10">
                      {capitalizeWords(kidGuardian.firstName)}{' '}
                      {capitalizeWords(kidGuardian.lastName as '')}
                    </div>
                    <div className="col-span-5">
                      {
                        KID_RELATION_CODE_MAPPER[
                          kidGuardian.relation as KidGuardianRelationCodeEnum
                        ]
                      }
                    </div>
                    <div className="col-span-9">
                      {kidGuardian.dialCodePhone} {kidGuardian.phone}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <div style={{ paddingTop: 10 }}>
            <Button
              loading={kidRegistrationSlice.loading && action === 'reprint'}
              loadingText="Reimprimiendo..."
              disabled={kidRegistrationSlice.loading}
              block
              type="primary"
              size="large"
              onClick={() => reprintRegisterLabelKid(2)}
            >
              Reimprimir registro
            </Button>
          </div>
          {IsSupervisorRegisterKidChurch(roles) && (
            <div style={{ paddingTop: 10, paddingBottom: 10 }}>
              <Button
                loading={kidRegistrationSlice.loading && action === 'remove'}
                loadingText="Eliminando registro..."
                disabled={kidRegistrationSlice.loading}
                block
                type="danger"
                size="large"
                onClick={() => removeKidRegistration()}
              >
                Eliminar Registro
              </Button>
            </div>
          )}
        </>
      )}
      {kidGuardianToUpdate && (
        <UpdateKidGuardianPhoneModal
          visible={openUpdateKidGuardianPhoneModal}
          onClose={(status: boolean) => setOpenUpdateKidGuardianPhoneModal(status)}
          kidGuardian={kidGuardianToUpdate}
        />
      )}
      <ConfirmationModal
        id={'changeKidVolunteerModal'}
        title={`Cambiar niño a ${isKidVolunteer ? 'recibir en Iglekids' : 'Yo Soy Iglekids'}`}
        content={`El niño sera cambiado ${isKidVolunteer ? 'para recibir en Iglekids' : 'al area de Yo Soy Iglekids'}. Por favor confirmar si desea realizar esta acción`}
        confirmButtonText="Confirmar"
        confirmButtonType={ColorType.SUCCESS}
        onConfirm={() => setIsKidVolunteer(!isKidVolunteer)}
        cancelButtonText="Cancelar"
        cancelButtonType={ColorType.INFO}
      />
    </div>
  );
};

export default KidRegistrationView;
