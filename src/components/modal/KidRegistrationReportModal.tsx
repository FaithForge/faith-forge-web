import { churchGroupOptions } from '@/libs/common-types/constants';
import { RootState } from '@/libs/state/redux';
import { FFDay } from '@/libs/utils/ffDay';
import { useState } from 'react';
import { FaCopy, FaShareAlt } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Button, Form, hooks, Input, Radio, Selector } from 'react-vant';

const KidRegistrationReportModal = () => {
  const churchCampusSlice = useSelector(
    (state: RootState) => state.churchCampusSlice,
  );
  const churchMeetingSlice = useSelector(
    (state: RootState) => state.churchMeetingSlice,
  );
  const [form] = Form.useForm();

  const now = FFDay.utc()
    .tz('America/Bogota')
    .startOf('day')
    .format('YYYY-MM-DD');
  const [isFinished, setIsFinished] = useState(false);

  const defaultState = {
    group: '',
    computer: 'Si',
    computerCharger: 'Si',
    printer: '',
    scissors: '',
    markers: '',
    pencils: '',
    stickerPacks: 'Si',
    printerCables: '',
    printerCharger: '',
    printerRolls: '',
    welcomeStickerBoy: 'Si',
    welcomeStickerGirl: 'Si',
    birthdayStickerBoy: 'Si',
    birthdayStickerGirl: 'Si',
    observationGeneral: '',
  };
  const [state, updateState] = hooks.useSetState(defaultState);

  const onGenerateReport = () => {
    setIsFinished(true);
  };

  const onFinish = () => {
    updateState(defaultState);
    setIsFinished(false);
    form.resetFields();
  };

  const generateReport = () => {
    return `*📝 Reporte de Servicio*
📅 ${now}
📍 ${churchCampusSlice.current?.name}
⛪ ${churchMeetingSlice.current?.name}
👥 Grupo: ${state.group}

*📋 Inventario*
💻 Comp: ${state.computer === 'Si' ? '✅' : '❌'}
🔌 Carg. Comp: ${state.computerCharger === 'Si' ? '✅' : '❌'}
🖨️ Impresora: ${state.printer}
🔌 Cab. Impresora: ${state.printerCables}
🔋 Carg. Impresora: ${state.printerCharger}
📦 Rollos: ${state.printerRolls}
✂️ Tijeras: ${state.scissors}
🖍️ Marcadores: ${state.markers}
🖊️ Lapiceros: ${state.pencils}
📦 Stickers prov. (3+): ${state.stickerPacks === 'Si' ? '✅' : '❌'}
👦🎉 Bienv. Niños (20+): ${state.welcomeStickerBoy === 'Si' ? '✅' : '❌'}
👧🎉 Bienv. Niñas (20+): ${state.welcomeStickerGirl === 'Si' ? '✅' : '❌'}
👦🎂 Cumple. Niños (10+): ${state.birthdayStickerBoy === 'Si' ? '✅' : '❌'}
👧🎂 Cumple. Niñas (10+): ${state.birthdayStickerGirl === 'Si' ? '✅' : '❌'}

*ℹ️ Observaciones*
${state.observationGeneral}`;
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

  const churchOptions = churchGroupOptions
    ? churchGroupOptions.map((churchGroup: string) => {
        return {
          label: churchGroup,
          value: churchGroup,
        };
      })
    : [];

  return (
    <dialog id="reportKidRegistrationModal" className="modal modal-bottom">
      <div className="modal-box">
        <form method="dialog">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={onFinish}
          >
            ✕
          </button>
        </form>
        <h3 className="text-xl font-bold text-center">Reporte Regikids</h3>
        <div className="py-4">
          {isFinished ? (
            <div>
              <h2 className="text-lg font-bold text-center py-2">
                ¡Reporte generado!
              </h2>
              <p style={{ marginBottom: 20 }}>
                Elige si deseas compartir por WhatsApp (se abrirá el grupo y
                elige el grupo de Supervisores Regikids) o copia el texto y
                pegado en el grupo. Una vez terminado cierra esta ventana
              </p>
              <Button
                type="primary"
                size="large"
                style={{ marginBottom: 10 }}
                icon={<FaShareAlt />}
                onClick={() => {
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
                  copyReportRegistrationGroup();
                }}
              >
                Copiar texto
              </Button>
            </div>
          ) : (
            <Form
              layout="vertical"
              onFinish={onGenerateReport}
              form={form}
              footer={
                <>
                  <Button
                    nativeType="submit"
                    type="primary"
                    block
                    style={{
                      paddingTop: 5,
                      paddingBottom: 5,
                      marginTop: 5,
                      marginBottom: 10,
                    }}
                  >
                    Generar informe para compartir
                  </Button>
                </>
              }
            >
              <h2 className="text-lg font-bold py-2">
                Información del grupo y servicio (Obligatorio)
              </h2>
              <p>
                <span className="font-bold">Sede para el reporte:</span>{' '}
                {churchCampusSlice.current?.name}
              </p>
              <p>
                <span className="font-bold">Reunión para el reporte:</span>{' '}
                {churchMeetingSlice.current?.name}
              </p>
              <Form.Item
                name="churchGroup"
                label="Grupo que sirvió"
                rules={[
                  { required: true, message: 'Por favor seleccione un grupo' },
                ]}
              >
                <Selector
                  options={churchOptions}
                  onChange={async (arr) => {
                    if (arr.length) {
                      updateState({
                        group: churchOptions.find(
                          (churchOption) => churchOption.value === arr[0],
                        )?.label,
                      });
                    } else {
                      updateState({
                        group: '',
                      });
                    }
                  }}
                />
              </Form.Item>

              <h2 className="text-lg font-bold py-2">
                Inventario (Obligatorio)
              </h2>
              <Form.Item name="computer" label="¿Esta el computador?">
                <Radio.Group
                  defaultValue="Si"
                  direction="horizontal"
                  onChange={(computer) => updateState({ computer })}
                >
                  <Radio name="Si">Si</Radio>
                  <Radio name="No">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="computerCharger"
                label="¿Esta el cargador del computador?"
              >
                <Radio.Group
                  defaultValue="Si"
                  direction="horizontal"
                  onChange={(computerCharger) =>
                    updateState({ computerCharger })
                  }
                >
                  <Radio name="Si">Si</Radio>
                  <Radio name="No">No</Radio>
                </Radio.Group>
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
                name="stickerPacks"
                label="¿Hay más de 3 paquetes de stickers provisionales?"
              >
                <Radio.Group
                  defaultValue="Si"
                  direction="horizontal"
                  onChange={(stickerPacks) => updateState({ stickerPacks })}
                >
                  <Radio name="Si">Si</Radio>
                  <Radio name="No">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="welcomeStickerBoy"
                label="¿Hay más de 20 stickers de bienvenida (Niños)?"
              >
                <Radio.Group
                  defaultValue="Si"
                  direction="horizontal"
                  onChange={(welcomeStickerBoy) =>
                    updateState({ welcomeStickerBoy })
                  }
                >
                  <Radio name="Si">Si</Radio>
                  <Radio name="No">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="welcomeStickerGirl"
                label="¿Hay más de 20 stickers de stickers de bienvenida (Niñas)?"
              >
                <Radio.Group
                  defaultValue="Si"
                  direction="horizontal"
                  onChange={(welcomeStickerGirl) =>
                    updateState({ welcomeStickerGirl })
                  }
                >
                  <Radio name="Si">Si</Radio>
                  <Radio name="No">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="birthdayStickerBoy"
                label="¿Hay más de 10 stickers de cumpleaños (Niños)?"
              >
                <Radio.Group
                  defaultValue="Si"
                  direction="horizontal"
                  onChange={(birthdayStickerBoy) =>
                    updateState({ birthdayStickerBoy })
                  }
                >
                  <Radio name="Si">Si</Radio>
                  <Radio name="No">No</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="birthdayStickerGirl"
                label="¿Hay más de 10 stickers de cumpleaños (Niñas)?"
              >
                <Radio.Group
                  defaultValue="Si"
                  direction="horizontal"
                  onChange={(birthdayStickerGirl) =>
                    updateState({ birthdayStickerGirl })
                  }
                >
                  <Radio name="Si">Si</Radio>
                  <Radio name="No">No</Radio>
                </Radio.Group>
              </Form.Item>
              <h2 className="text-lg font-bold py-2">
                Observaciones generales (Obligatorio)
              </h2>
              <p>
                Si tuvo algún inconveniente que desee comentar, queja o reclamo,
                por favor manifestarlo. En caso contrario, manifestar que deja
                el área en perfectas condiciones para el siguiente grupo.
              </p>

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
            </Form>
          )}

          <form method="dialog">
            <button className="btn btn-block btn-success" onClick={onFinish}>
              Finalizar
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
};

export default KidRegistrationReportModal;
