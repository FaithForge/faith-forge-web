import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import NavBarApp from '../../components/NavBarApp';
import { Button, ErrorBlock, Grid, SearchBar, Space } from 'antd-mobile';
import 'dayjs/locale/es';

import { Layout } from '@/components/Layout';
import { QRCode } from 'react-qrcode-logo';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { GetKidGuardian } from '@/redux/thunks/kid-church/kid-guardian.thunk';
import {
  CloudDownloadOutlined,
  PrinterOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { capitalizeWords } from '@/utils/text';
import { cleanCurrentKidGuardian } from '@/redux/slices/kid-church/kid-guardian.slice';
import LoadingMask from '@/components/LoadingMask';

const GenerateQRKidGuardianView: NextPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [search, setSearch] = useState(false);

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
    if (guardian) {
      setSearch(true);
    }
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
      downloadLink.download = `${guardian?.nationalId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const sharedCode = async () => {
    const canvas: any = document.getElementById(
      'qr-code-generate-kid-guardian',
    );
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      const blob = await (await fetch(dataUrl)).blob();
      const filesArray = [
        new File([blob], `${guardian?.nationalId}.png`, {
          type: blob.type,
          lastModified: new Date().getTime(),
        }),
      ];
      const shareData = {
        files: filesArray,
      };
      navigator.share(shareData);
    }
  };

  return (
    <Layout>
      {guardianLoading ? <LoadingMask /> : ''}

      <NavBarApp title="Generar Codigo QR" />
      <SearchBar
        placeholder="Colocar Numero de Cedula del Acudiente"
        onSearch={(value) => findGuardian(value)}
      />
      {guardian && (
        <>
          <p
            style={{ textAlign: 'center', marginBottom: 0, fontWeight: 'bold' }}
          >
            {capitalizeWords(guardian.firstName)}{' '}
            {capitalizeWords(guardian.lastName)}
          </p>
          <p style={{ textAlign: 'center', margin: 0 }}>
            Telefono: {guardian.phone}
          </p>
          <div
            style={{
              marginTop: 10,
              marginBottom: 10,
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
            }}
          >
            <QRCode
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

          <Grid columns={1} gap={8}>
            <Grid.Item>
              <Button onClick={() => sharedCode()} block color="primary">
                <Space>
                  <ShareAltOutlined />
                  <span>Compartir</span>
                </Space>
              </Button>
            </Grid.Item>
            <Grid.Item>
              <Button onClick={() => downloadCode()} block color="primary">
                <Space>
                  <CloudDownloadOutlined />
                  <span>Descargar</span>
                </Space>
              </Button>
            </Grid.Item>

            <Grid.Item>
              <Button block disabled color="primary">
                <Space>
                  <PrinterOutlined />
                  <span>Imprimir</span>
                </Space>
              </Button>
            </Grid.Item>
          </Grid>
        </>
      )}
      {!guardian && (
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
      )}
    </Layout>
  );
};

export default GenerateQRKidGuardianView;
