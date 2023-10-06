import React, { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { SafeArea, TabBar } from 'antd-mobile';
import { AppOutline } from 'antd-mobile-icons';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Head from 'next/head';
import { Providers } from '../redux/provider';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { store } from '../redux/store';
import Setup from './_setup';
import { SettingOutlined } from '@ant-design/icons';

const tabs = [
  {
    key: '/registration',
    title: 'Registro',
    icon: <AppOutline />,
  },
  {
    key: '/settings',
    title: 'Configuracion',
    icon: <SettingOutlined />,
  },
];

function MyApp({ Component, pageProps }: AppProps) {
  const [paddingSize, setPaddingSize] = useState({ width: 0, height: 0 });
  const router = useRouter();
  const pathname = usePathname();
  const persistor = persistStore(store);

  useEffect(() => {
    const TabBar = document.querySelector('.TabBarApp') as HTMLElement;
    if (TabBar) {
      const width = TabBar.offsetWidth;
      const height = TabBar.offsetHeight;
      setPaddingSize({ width, height });
    }
  }, []);

  return (
    <Providers>
      <PersistGate loading={null} persistor={persistor}>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          />
          <meta name="HandheldFriendly" content="true" />
        </Head>
        <SafeArea position="top" />
        <div style={{ minHeight: '100vh' }}>
          <div
            style={{
              paddingBottom: paddingSize.height > 0 ? paddingSize.height : 50,
            }}
          >
            <Component {...pageProps} />
          </div>
          <TabBar
            activeKey={`/${pathname.split('/')[1]}`}
            onChange={(value) => router.push(value)}
            style={{
              position: 'fixed',
              bottom: '0',
              left: '0',
              width: '100%',
              backgroundColor: 'white',
            }}
            className="TabBarApp"
          >
            {tabs.map((item) => (
              <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
            ))}
          </TabBar>
          <Setup />
        </div>
        <SafeArea position="bottom" />
      </PersistGate>
    </Providers>
  );
}
export default MyApp;
