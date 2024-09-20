import React from 'react';
import type { AppProps } from 'next/app';
import { ConfigProvider, SafeArea } from 'antd-mobile';
import Head from 'next/head';
import { Providers } from '../redux/provider';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { store } from '../redux/store';
import Setup from './_setup';
import esES from 'antd-mobile/es/locales/es-ES';
import './theme.css';

function MyApp({ Component, pageProps }: AppProps) {
  const persistor = persistStore(store);

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
        <ConfigProvider locale={esES}>
          <SafeArea position="top" />
          <Component {...pageProps} />
          <Setup />
          <SafeArea position="bottom" />
        </ConfigProvider>
      </PersistGate>
    </Providers>
  );
}
export default MyApp;
