/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import NavBarApp from '../../components/NavBarApp';
import 'dayjs/locale/es';

import { QRCode } from 'react-qrcode-logo';
import { useDispatch, useSelector } from 'react-redux';

import { Button, Grid, Search, Space, Typography } from 'react-vant';
import LoadingMask from '../../components/LoadingMask';
import { capitalizeWords } from '../../utils/text';
import { Layout } from '../../components/Layout';
import {
  AppDispatch,
  GetKidGuardian,
  RootState,
  UploadQRCodeImage,
  cleanCurrentKidGuardian,
} from '@faith-forge-web/state/redux';

const GenerateQRKidGuardianView: NextPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [search, setSearch] = useState(false);
  const [urlCode, setUrlCode] = useState<string | undefined>(undefined);

  const { current: guardian, loading: guardianLoading } = useSelector(
    (state: RootState) => state.kidGuardianSlice,
  );

  const findGuardian = async (guardianNationalId: string) => {
    dispatch(GetKidGuardian(guardianNationalId));
  };

  useEffect(() => {
    dispatch(cleanCurrentKidGuardian());
  }, []);

  useEffect(() => {
    const fetchUrl = async () => {
      if (guardian) {
        setLoading(true);
        setSearch(true);
        const url = await sharedCQRodeWhatsapp();
        setUrlCode(url);
        setLoading(false);
      }
    };

    fetchUrl();
  }, [guardian]);

  const downloadCode = () => {
    const canvas: any = document.getElementById(
      'qr-code-generate-kid-guardian',
    );
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${guardian?.id}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  // const sharedCode = async () => {
  //   const canvas: any = document.getElementById(
  //     'qr-code-generate-kid-guardian',
  //   );
  //   if (canvas) {
  //     const dataUrl = canvas.toDataURL();
  //     const blob = await (await fetch(dataUrl)).blob();
  //     const filesArray = [
  //       new File([blob], `${guardian?.id}.png`, {
  //         type: blob.type,
  //         lastModified: new Date().getTime(),
  //       }),
  //     ];
  //     const shareData = {
  //       files: filesArray,
  //     };
  //     navigator.share(shareData);
  //   }
  // };

  const sharedCQRodeWhatsapp = async () => {
    const canvas: any = document.getElementById(
      'qr-code-generate-kid-guardian',
    );
    const canvasWhatsapp: any = document.getElementById(
      'qr-code-generate-kid-guardian-whatsapp',
    );
    if (canvas && canvasWhatsapp && guardian && guardian.id) {
      const dataUrl = canvas.toDataURL();
      const photo = await (await fetch(dataUrl)).blob();

      const formData = new FormData();
      formData.append('file', photo);
      formData.append('qrCodeValue', guardian.id);
      const photoUrl = (await dispatch(UploadQRCodeImage({ formData })))
        .payload as string;

      const url = `https://api.whatsapp.com/send?phone=57${
        guardian.phone
      }&text=${encodeURIComponent(
        `¡Hola *${capitalizeWords(guardian.firstName)} ${capitalizeWords(
          guardian.lastName,
        )}*!
Desde Iglekids te enviamos este enlace para descargar un código QR, el cual podrás mostrar cada vez que registres a tu(s) niño(s) para que este proceso sea más ágil:

*URL de imagen:* ${photoUrl}
        
Este código es personal, solo lo puede presentar el acudiente que esté relacionado en el QR.`,
      )}`;

      return url;
    }
  };

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth * 0.9,
    height: window.innerHeight * 0.9,
  });

  const handleResize = () => {
    setWindowSize({
      width: window.innerWidth * 0.9,
      height: window.innerHeight * 0.9,
    });
  };

  // Monitorea cambios en el tamaño de la ventana
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Layout>
      {guardianLoading || loading ? <LoadingMask /> : ''}

      <NavBarApp title="Generar Código QR" />
      <Search
        placeholder="Colocar Numero de Cedula del Acudiente"
        onSearch={(value) => findGuardian(value)}
      />
      {guardian && (
        <>
          <Grid columnNum={1} border={false}>
            <Grid.Item>
              <Typography.Title
                level={3}
                style={{
                  textAlign: 'center',
                  marginTop: '0px',
                  marginBottom: '0px',
                }}
              >
                {capitalizeWords(guardian.firstName)}{' '}
                {capitalizeWords(guardian.lastName)}
              </Typography.Title>
              <Typography.Title
                level={4}
                style={{ textAlign: 'center', marginTop: '5px' }}
              >
                Telefono: {guardian.phone}
              </Typography.Title>
              <Typography.Text style={{ textAlign: 'center' }}>
                Pide al acudiente que lea este código con su celular y se
                autoenvíe el mensaje generado (Este debe tener Whatsapp
                instalado con el número de teléfono que aparece arriba)
              </Typography.Text>
              <QRCode
                qrStyle="dots"
                value={urlCode}
                size={windowSize.width}
                id="qr-code-generate-kid-guardian-whatsapp"
              />
            </Grid.Item>
            {/* <Grid.Item>
              <Button onClick={() => sharedCode()} block color="primary">
                <Space>
                  <ShareAltOutlined />
                  <span>Compartir Imagen</span>
                </Space>
              </Button>
            </Grid.Item> */}
            <Grid.Item>
              <Button onClick={() => downloadCode()} block type="primary">
                <Space>
                  {/* <CloudDownloadOutlined /> */}
                  <span>Descargar</span>
                </Space>
              </Button>
              <Button block disabled type="primary">
                <Space>
                  {/* <PrinterOutlined /> */}
                  <span>Imprimir (Proximanente)</span>
                </Space>
              </Button>
            </Grid.Item>
          </Grid>
          <QRCode
            style={{ display: 'contents' }}
            qrStyle="dots"
            value={guardian.id}
            logoImage={'/logo-iglekids.png'}
            logoHeight={141}
            logoWidth={217}
            logoOpacity={0.4}
            size={365}
            id="qr-code-generate-kid-guardian"
          />
        </>
      )}
      {/* {!guardian && (
        <ErrorBlock
          fullPage
          status="empty"
          title={`${
            search
              ? 'No se ha encontrado acudiente'
              : 'Por favor buscar el acudiente a generar QR'
          }`}
          description={`${
            search
              ? 'Digite cedula para buscar'
              : 'Verifique la cedula digitada'
          }`}
        />
      )} */}
    </Layout>
  );
};

export default GenerateQRKidGuardianView;
