/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextPage } from 'next';
import { useDispatch, useSelector } from 'react-redux';
import NavBarApp from '../../components/NavBarApp';
import { useEffect, useState } from 'react';
import {
  Button,
  Collapse,
  Form,
  hooks,
  Input,
  Notify,
  Picker,
  Popup,
  Selector,
  Typography,
} from 'react-vant';
import { Layout } from '../../components/Layout';
import { FaCopy, FaPrint } from 'react-icons/fa6';
import { MdComputer } from 'react-icons/md';
import { AiOutlineScissor } from 'react-icons/ai';
import { FaShareAlt } from 'react-icons/fa';
import { churchGroupOptions } from '@/libs/common-types/constants';
import { MS, HttpRequestMethod } from '@/libs/common-types/global';
import { ChurchMeetingStateEnum } from '@/libs/models';
import {
  AppDispatch,
  RootState,
  updateUserChurchGroup,
} from '@/libs/state/redux';
import { FFDay } from '@/libs/utils/ffDay';
import { microserviceApiRequest } from '@/libs/utils/http';

const ReportRegistrationGroup: NextPage = () => {
  const [form] = Form.useForm();
  const [churches, setChurches] = useState([]);
  const [churchMeetings, setChurchMeetings] = useState([]);
  const dispatch = useDispatch<AppDispatch>();

  const now = FFDay.utc()
    .tz('America/Bogota')
    .startOf('day')
    .format('YYYY-MM-DD');
  const [isLoading, setIsLoading] = useState(false);
  const authSlice = useSelector((state: RootState) => state.authSlice);
  const accountSlice = useSelector((state: RootState) => state.accountSlice);
  const { token } = useSelector((state: RootState) => state.authSlice);
  const [state, updateState] = hooks.useSetState({
    church: '',
    meetingChurch: '',
    group: '',
    computer: '',
    printer: '',
    scissors: '',
    markers: '',
    pencils: '',
    stickerPacks: '',
    printerCables: '',
    printerCharger: '',
    computerCase: '',
    computerCharger: '',
    printerRolls: '',
    welcomeStickerBoy: '',
    welcomeStickerGirl: '',
    birthdayStickerBoy: '',
    birthdayStickerGirl: '',
    observationGeneral: '',
    observationComputer: '',
    observationPrinter: '',
    observationElements: '',
  });
  const [visible, setVisible] = useState(false);

  const onFinish = (values: any) => {
    const churchGroup = values.churchGroup;

    setVisible(true);
    dispatch(updateUserChurchGroup(churchGroup));
  };

  useEffect(() => {
    (async () => {
      const churchesResponse = (
        await microserviceApiRequest({
          microservice: MS.Church,
          method: HttpRequestMethod.GET,
          url: `/churches`,
          options: {
            headers: { Authorization: `Bearer ${token}` },
          },
        })
      ).data;
      setChurches(churchesResponse);
    })();
  }, []);

  const generateReport = () => {
    return `*Reporte de servicio 📝*
*- Fecha:* ${now}
*- Sede:* ${state.church}
*- Servicio:* ${state.meetingChurch}
*- Grupo:* ${state.group}
    
*Inventario ✅*
*- Computadores*: ${state.computer}
*- Forros de computadores*: ${state.computerCase}
*- Cargadores de computadores*: ${state.computerCharger}
*- Impresoras*: ${state.printer}
*- Cables de impresoras*: ${state.printerCables}
*- Cargador de impresoras*: ${state.printerCharger}
*- Rollos de Impresoras*: ${state.printerRolls}
*- Tijeras*: ${state.scissors}
*- Marcadores*: ${state.markers}
*- Lapiceros*: ${state.pencils}
*- Paquetes de stickers provisionales*: ${state.stickerPacks}
*- Stickers bienvenidos (Niños)*: ${state.welcomeStickerBoy}
*- Stickers bienvenidos (Niñas)*: ${state.welcomeStickerGirl}
*- Stickers cumpleaños (Niños)*: ${state.birthdayStickerBoy}
*- Stickers cumpleaños (Niñas)*: ${state.birthdayStickerGirl}

*Observaciones generales ℹ️*
${state.observationGeneral}

${
  state.observationComputer
    ? `*Observaciones de computador 🖥️*
${state.observationComputer}

`
    : ''
}${
      state.observationPrinter
        ? `*Observaciones de impresoras 🖨️*
${state.observationPrinter}

`
        : ''
    }${
      state.observationElements
        ? `*Observaciones de elementos ✂️*
${state.observationElements}`
        : ''
    }`;
  };

  const sharedReportRegistrationGroup = () => {
    const shareData = {
      text: generateReport(),
    };
    navigator.share(shareData);
  };

  const copyReportRegistrationGroup = () => {
    navigator.clipboard
      .writeText(generateReport())
      .then(() => console.log('Texto copiado al portapapeles'))
      .catch((err) => console.error('Error al copiar:', err));
  };

  const findChurchMeetings = async (meetingId: any) => {
    setIsLoading(true);
    const churchMeetingsResponse = (
      await microserviceApiRequest({
        microservice: MS.Church,
        method: HttpRequestMethod.GET,
        url: `/church/${meetingId}/meetings`,
        options: {
          params: {
            state: ChurchMeetingStateEnum.ACTIVE,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      })
    ).data;
    setChurchMeetings(churchMeetingsResponse);
    setIsLoading(false);
  };

  const churchOptions = churches
    ? churches.map((church: any) => {
        return {
          label: church.name,
          value: church.id,
        };
      })
    : [];

  const churchMeetingOptions = churchMeetings
    ? churchMeetings.map((churchMeeting: any) => {
        return {
          label: churchMeeting.name,
          value: churchMeeting.id,
        };
      })
    : [];

  return (
    <Layout>
      <NavBarApp title="Generar Reporte de Regikids" />
      <Form
        layout="vertical"
        onFinish={onFinish}
        form={form}
        footer={
          <Button
            nativeType="submit"
            type="primary"
            block
            style={{ paddingTop: 5, paddingBottom: 5, marginTop: 5 }}
          >
            Generar informe para compartir
          </Button>
        }
        style={{ paddingLeft: 15, paddingRight: 15 }}
      >
        <Typography.Title level={3}>
          Información del grupo y servicio (Obligatorio)
        </Typography.Title>
        <Form.Item
          name="church"
          label="Sede"
          rules={[
            { required: true, message: 'Por favor seleccionar una sede' },
          ]}
        >
          <Selector
            options={churchOptions}
            onChange={async (arr) => {
              if (arr.length) {
                updateState({
                  church: churchOptions.find(
                    (churchOption) => churchOption.value === arr[0],
                  )?.label,
                });
                await findChurchMeetings(arr[0]);
              } else {
                updateState({
                  church: '',
                });
                setChurchMeetings([]);
              }
            }}
          />
        </Form.Item>
        <Form.Item
          name="churchMeeting"
          label="Servicio"
          rules={[
            {
              required: true,
              message: 'Por favor seleccionar una reunión',
            },
          ]}
        >
          <Selector
            options={churchMeetingOptions}
            onChange={async (arr) => {
              if (arr.length) {
                updateState({
                  meetingChurch: churchMeetingOptions.find(
                    (churchOption) => churchOption.value === arr[0],
                  )?.label,
                });
              } else {
                updateState({
                  meetingChurch: '',
                });
              }
            }}
          />
        </Form.Item>
        <Form.Item
          isLink
          name="churchGroup"
          label="Grupo que sirvió"
          rules={[{ required: true, message: 'Por favor seleccione un grupo' }]}
          onClick={(_, action) => {
            action?.current?.open();
          }}
        >
          <Picker
            popup
            columns={churchGroupOptions}
            placeholder={'Seleccione un grupo'}
            confirmButtonText={'Confirmar'}
            cancelButtonText={'Cancelar'}
            onChange={(val: string) => {
              updateState({
                group: val,
              });
            }}
          >
            {(val) => val || 'Seleccione un grupo'}
          </Picker>
        </Form.Item>

        <Typography.Title level={3}>Inventario (Obligatorio)</Typography.Title>
        <Form.Item
          name="computer"
          label="Cantidad de computadores"
          rules={[
            {
              required: true,
              message: 'Por favor seleccione la cantidad de computadores',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.computer}
            type="digit"
            onChange={(computer) => updateState({ computer })}
          />
        </Form.Item>
        <Form.Item
          name="computerCharger"
          label="Cantidad de cargadores de computadores"
          rules={[
            {
              required: true,
              message: 'Por favor digite un número',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.computerCharger}
            type="digit"
            onChange={(computerCharger) => updateState({ computerCharger })}
          />
        </Form.Item>
        <Form.Item
          name="computerCase"
          label="Cantidad de forros de computador"
          rules={[
            {
              required: true,
              message: 'Por favor digite un número',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.computerCase}
            type="digit"
            onChange={(computerCase) => updateState({ computerCase })}
          />
        </Form.Item>
        {/*Impresoras*/}
        <Form.Item
          name="printer"
          label="Cantidad de impresoras"
          rules={[
            {
              required: true,
              message: 'Por favor digite un número',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.printer}
            type="digit"
            onChange={(printer) => updateState({ printer })}
          />
        </Form.Item>
        <Form.Item
          name="printerCables"
          label="Cantidad de cables de impresoras"
          rules={[
            {
              required: true,
              message: 'Por favor digite un número',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.printerCables}
            type="digit"
            onChange={(printerCables) => updateState({ printerCables })}
          />
        </Form.Item>
        <Form.Item
          name="printerCharger"
          label="Cantidad de cargadores de impresoras"
          rules={[
            {
              required: true,
              message: 'Por favor digite un número',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.printerCharger}
            type="digit"
            onChange={(printerCharger) => updateState({ printerCharger })}
          />
        </Form.Item>
        <Form.Item
          name="scissors"
          label="Cantidad de tijeras"
          rules={[
            {
              required: true,
              message: 'Por favor digite un número',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.scissors}
            type="digit"
            onChange={(scissors) => updateState({ scissors })}
          />
        </Form.Item>
        <Form.Item
          name="markers"
          label="Cantidad de marcadores"
          rules={[
            {
              required: true,
              message: 'Por favor digite un número',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.markers}
            type="digit"
            onChange={(markers) => updateState({ markers })}
          />
        </Form.Item>
        <Form.Item
          name="pencils"
          label="Cantidad de lapiceros"
          rules={[
            {
              required: true,
              message: 'Por favor digite un número',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.pencils}
            type="digit"
            onChange={(pencils) => updateState({ pencils })}
          />
        </Form.Item>
        <Form.Item
          name="stickerPacks"
          label="Cantidad de paquetes de stickers provisionales"
          rules={[
            {
              required: true,
              message: 'Por favor digite un número',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.stickerPacks}
            type="digit"
            onChange={(stickerPacks) => updateState({ stickerPacks })}
          />
        </Form.Item>
        <Form.Item
          name="printerRolls"
          label="Cantidad de rollos de impresoras"
          rules={[
            {
              required: true,
              message: 'Por favor digite un número',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.printerRolls}
            type="digit"
            onChange={(printerRolls) => updateState({ printerRolls })}
          />
        </Form.Item>
        <Form.Item
          name="welcomeStickerBoy"
          label="Cantidad de sticket de bienvenida (Niños)"
          rules={[
            {
              required: true,
              message: 'Por favor digite un número',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.welcomeStickerBoy}
            type="digit"
            onChange={(welcomeStickerBoy) => updateState({ welcomeStickerBoy })}
          />
        </Form.Item>
        <Form.Item
          name="welcomeStickerGirl"
          label="Cantidad de sticket de bienvenida (Niñas)"
          rules={[
            {
              required: true,
              message: 'Por favor digite un número',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.welcomeStickerGirl}
            type="digit"
            onChange={(welcomeStickerGirl) =>
              updateState({ welcomeStickerGirl })
            }
          />
        </Form.Item>
        <Form.Item
          name="birthdayStickerBoy"
          label="Cantidad de sticket de cumpleaños (Niños)"
          rules={[
            {
              required: true,
              message: 'Por favor digite un número',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.birthdayStickerBoy}
            type="digit"
            onChange={(birthdayStickerBoy) =>
              updateState({ birthdayStickerBoy })
            }
          />
        </Form.Item>
        <Form.Item
          name="birthdayStickerGirl"
          label="Cantidad de sticket de cumpleaños (Niñas)"
          rules={[
            {
              required: true,
              message: 'Por favor digite un número',
            },
          ]}
        >
          <Input
            placeholder="Digite un número"
            value={state.birthdayStickerGirl}
            type="digit"
            onChange={(birthdayStickerGirl) =>
              updateState({ birthdayStickerGirl })
            }
          />
        </Form.Item>
        <Typography.Title level={3}>
          Observaciones generales (Obligatorio)
        </Typography.Title>
        <Typography.Text>
          Si tuvo algún inconveniente que desee comentar, queja o reclamo, por
          favor manifestarlo. En caso contrario, manifestar que deja el área en
          perfectas condiciones para el siguiente grupo.
        </Typography.Text>

        <Form.Item
          name="observationGeneral"
          rules={[
            {
              required: true,
              message: 'Por favor escriba su observación',
            },
          ]}
        >
          <Input.TextArea
            placeholder="Escriba aqui su observación"
            showWordLimit
            rows={3}
            value={state.observationGeneral}
            onChange={(observationGeneral) =>
              updateState({ observationGeneral })
            }
          />
        </Form.Item>
        <Typography.Title level={3}>
          Observaciones a tener en cuenta (Opcionales)
        </Typography.Title>
        <Typography.Text>Expandir para colocar observaciones</Typography.Text>
        <Collapse accordion>
          <Collapse.Item icon={<MdComputer />} title={'Computador'} name="1">
            <Form.Item
              name="observationComputer"
              label="¿Alguna observación con el computador?"
            >
              <Input.TextArea
                placeholder="Si tuvo algun problema con el computador"
                showWordLimit
                value={state.observationComputer}
                onChange={(observationComputer) =>
                  updateState({ observationComputer })
                }
              />
            </Form.Item>
          </Collapse.Item>
          <Collapse.Item icon={<FaPrint />} title="Impresoras" name="2">
            <Form.Item
              name="observationPrinter"
              label="¿Alguna observación con las impresoras?"
            >
              <Input.TextArea
                placeholder="Si tuvo algun problema con alguna de las impresoras por favor describirla"
                showWordLimit
                value={state.observationPrinter}
                onChange={(observationPrinter) =>
                  updateState({ observationPrinter })
                }
              />
            </Form.Item>
          </Collapse.Item>
          <Collapse.Item
            icon={<AiOutlineScissor />}
            title="Otros elementos del area"
            name="3"
          >
            <Form.Item
              name="observationElements"
              label="¿Alguna observación con algun otro elemento del area?"
            >
              <Input.TextArea
                placeholder="Si tiene alguna observación con algun elemento del area, por favor explicarla"
                showWordLimit
                value={state.observationElements}
                onChange={(observationElements) =>
                  updateState({ observationElements })
                }
              />
            </Form.Item>
          </Collapse.Item>
        </Collapse>
      </Form>
      <Popup
        visible={visible}
        onClose={() => setVisible(false)}
        round={true}
        style={{ width: '85vw' }}
        closeable
      >
        <div style={{ padding: '20px 20px' }}>
          <Typography.Title
            level={3}
            style={{ marginTop: 0, textAlign: 'center' }}
          >
            ¡Reporte generado!
          </Typography.Title>
          <Typography.Text style={{ marginBottom: 20 }}>
            Elige si deseas compartir por WhatsApp (se abrirá el grupo y elige
            el grupo de Supervisores Regikids) o copia el texto y pegado en el
            grupo. Una vez terminado cierra esta ventana
          </Typography.Text>
          <Button
            type="primary"
            size="large"
            style={{ marginBottom: 10 }}
            icon={<FaShareAlt />}
            onClick={() => {
              Notify.show({
                type: 'success',
                message: 'Compartido con exito',
              });
              sharedReportRegistrationGroup();
            }}
          >
            Compartir
          </Button>
          <Button
            type="primary"
            size="large"
            style={{ marginBottom: 10 }}
            icon={<FaCopy />}
            onClick={() => {
              Notify.show({
                type: 'success',
                message: 'Copiado con exito',
              });
              copyReportRegistrationGroup();
            }}
          >
            Copiar texto
          </Button>
        </div>
      </Popup>
    </Layout>
  );
};

export default ReportRegistrationGroup;
