import { Button, Form, Selector } from 'antd-mobile';
import type { NextPage } from 'next';
import { AppDispatch, RootState } from '../../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import NavBarApp from '../../components/NavBarApp';
import { useEffect } from 'react';
import { GetPrinters } from '../../services/churchService';
import { updateCurrentPrinter } from '../../redux/slices/churchSlice';
import LoadingMask from '../../components/LoadingMask';

const PrinterInfo: NextPage = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const churchSlice = useSelector((state: RootState) => state.churchSlice);

  const onFinish = (values: any) => {
    const printer = values.printer[0] ?? churchSlice.currentPrinter?.id;
    if (printer) {
      dispatch(updateCurrentPrinter(printer));
      router.back();
    }
  };

  useEffect(() => {
    if (churchSlice.current?.id && churchSlice.printers.length === 0) {
      dispatch(GetPrinters(churchSlice.current.id));
    }
    form.setFieldsValue({
      printer: [churchSlice.currentPrinter?.id],
    });
  }, [churchSlice, dispatch]);

  useEffect(() => {}, [form, churchSlice.currentPrinter?.id]);

  const printerOptions = churchSlice.printers
    ? churchSlice.printers.map((printer) => {
        return {
          label: printer.name,
          value: printer.id,
        };
      })
    : [];

  return (
    <>
      {churchSlice ? (
        <>
          {churchSlice.loading ? <LoadingMask /> : ''}
          <NavBarApp title="Configuración de Impresora" />
          <Form
            layout="vertical"
            onFinish={onFinish}
            form={form}
            footer={
              <Button block type="submit" color="primary" size="large">
                Guardar
              </Button>
            }
          >
            <Form.Item
              name="printer"
              label="Impresora seleccionada"
              rules={[
                {
                  required: true,
                  message: 'Por favor seleccionar una impresora',
                },
              ]}
            >
              <Selector options={printerOptions} />
            </Form.Item>
          </Form>
        </>
      ) : null}
    </>
  );
};

export default PrinterInfo;
