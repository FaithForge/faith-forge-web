/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextPage } from 'next';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import NavBarApp from '../../components/NavBarApp';
import { useEffect } from 'react';
import LoadingMask from '../../components/LoadingMask';
import { Button, Form, Selector } from 'react-vant';
import { TestPrintLabel } from '../../services/kidService';
import { Layout } from '../../components/Layout';
import {
  AppDispatch,
  GetChurchPrinters,
  RootState,
  updateCurrentChurchPrinter,
} from '@faith-forge-web/state/redux';

const PrinterInfo: NextPage = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const churchSlice = useSelector((state: RootState) => state.churchSlice);

  const churchPrinterSlice = useSelector(
    (state: RootState) => state.churchPrinterSlice,
  );

  const onFinish = (values: any) => {
    const printer = values.printer[0] ?? churchPrinterSlice.current?.id;
    if (printer) {
      dispatch(updateCurrentChurchPrinter(printer));
      router.back();
    }
  };

  useEffect(() => {
    if (churchSlice.current?.id) {
      dispatch(GetChurchPrinters(churchSlice.current?.id));
      form.setFieldsValue({
        printer: [churchPrinterSlice.current?.id],
      });
    }
  }, []);

  const testPrintLabel = () => {
    dispatch(TestPrintLabel());
    router.back();
  };

  const printerOptions = churchPrinterSlice.data
    ? churchPrinterSlice.data.map((printer: any) => {
        return {
          label: printer.name,
          value: printer.id,
        };
      })
    : [];

  return (
    <Layout>
      {churchPrinterSlice ? (
        <>
          {churchPrinterSlice.loading ? <LoadingMask /> : ''}
          <NavBarApp title="Configuración de Impresora" />
          <Form
            layout="vertical"
            onFinish={onFinish}
            form={form}
            footer={
              <Button block type="primary" size="large">
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
          <Button block color="success" size="large" onClick={testPrintLabel}>
            Probar impresora
          </Button>
        </>
      ) : null}
    </Layout>
  );
};

export default PrinterInfo;
