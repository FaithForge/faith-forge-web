/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import 'dayjs/locale/es';

import { QRCode } from 'react-qrcode-logo';
import { useDispatch, useSelector } from 'react-redux';

import { Button, Empty, Search, Space } from 'react-vant';
import LoadingMask from '../../components/LoadingMask';
import { Layout } from '../../components/Layout';
import {
  AppDispatch,
  RootState,
  GetKidGuardian,
  cleanCurrentKidGuardian,
  UploadQRCodeImage,
} from '@/libs/state/redux';
import { capitalizeWords } from '@/libs/utils/text';
import BackNavBar from '@/components/navbar/BackNavBar';

const GenerateQRKidGuardianView: NextPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState(false);
  const [urlCode, setUrlCode] = useState<string | undefined>(undefined);

  const { current: guardian, loading: guardianLoading } = useSelector(
    (state: RootState) => state.kidGuardianSlice,
  );

  const findGuardian = async (guardianNationalId: string) => {
    if (guardianNationalId) dispatch(GetKidGuardian(guardianNationalId));
  };

  useEffect(() => {
    dispatch(cleanCurrentKidGuardian());
  }, [dispatch]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardian]);

  const downloadCode = () => {
    const canvas: any = document.getElementById('qr-code-generate-kid-guardian');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
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
    const canvas: any = document.getElementById('qr-code-generate-kid-guardian');
    const canvasWhatsapp: any = document.getElementById('qr-code-generate-kid-guardian-whatsapp');
    if (canvas && canvasWhatsapp && guardian && guardian.id) {
      const dataUrl = canvas.toDataURL();
      const photo = await (await fetch(dataUrl)).blob();

      const formData = new FormData();
      formData.append('file', photo);
      formData.append('qrCodeValue', guardian.id);
      const photoUrl = (await dispatch(UploadQRCodeImage({ formData }))).payload as string;

      const url = `https://api.whatsapp.com/send?phone=${guardian.dialCodePhone.slice(1)}${
        guardian.phone
      }&text=${encodeURIComponent(
        `¡Hola *${capitalizeWords(guardian.firstName)} ${capitalizeWords(guardian.lastName)}*!
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

      <BackNavBar title="Generar Código QR" />
      <Search
        placeholder="Colocar Numero de Cedula del Acudiente"
        onSearch={(value) => findGuardian(value)}
        background="#fbfcff"
      />
      {guardian && (
        <>
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold m-0">
                {capitalizeWords(guardian.firstName)} {capitalizeWords(guardian.lastName)}
              </h3>
              <h4 className="text-lg font-medium mt-1">
                Teléfono: {guardian.dialCodePhone} {guardian.phone}
              </h4>
              <p className="text-gray-600 text-sm mt-2">
                Pide al acudiente que lea este código con su celular y se autoenvíe el mensaje
                generado (Este debe tener Whatsapp instalado con el número de teléfono que aparece
                arriba)
              </p>
              <div className="mt-4 flex justify-center">
                <QRCode
                  qrStyle="dots"
                  value={urlCode}
                  size={windowSize.width}
                  id="qr-code-generate-kid-guardian-whatsapp"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="w-full flex flex-col gap-2 px-4">
              <Button onClick={() => downloadCode()} block type="primary">
                <Space>
                  <span>Descargar</span>
                </Space>
              </Button>
              <Button block disabled type="primary">
                <Space>
                  <span>Imprimir (Próximamente)</span>
                </Space>
              </Button>
            </div>
          </div>
          <div className="absolute -left-[9999px] -top-[9999px]">
            <QRCode
              style={{ display: 'block' }}
              qrStyle="dots"
              value={guardian.id}
              logoImage={'/logo-iglekids.png'}
              logoHeight={141}
              logoWidth={217}
              logoOpacity={0.4}
              size={365}
              id="qr-code-generate-kid-guardian"
            />
          </div>
        </>
      )}
      {!guardian && (
        <Empty
          image={search ? 'error' : 'search'}
          description={`${
            search ? 'No se ha encontrado acudiente' : 'Por favor buscar el acudiente a generar QR'
          }`}
        />
      )}
    </Layout>
  );
};

export default GenerateQRKidGuardianView;
