import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Providers } from '../redux/provider';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { store } from '../redux/store';
import Setup from './_setup';
import { ConfigProvider } from 'react-vant';
import { themeVars } from '@/constants/theme';
import { SafeArea } from 'antd-mobile';
import './theme.css';
function MyApp({ Component, pageProps }: AppProps) {
  const persistor = persistStore(store);

  return (
    <Providers>
      <ConfigProvider themeVars={themeVars}>
        <PersistGate loading={null} persistor={persistor}>
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
            />
            <meta name="HandheldFriendly" content="true" />
          </Head>
          <SafeArea position="top" />
          <Component {...pageProps} />
          <Setup />
          <SafeArea position="bottom" />
        </PersistGate>
      </ConfigProvider>
    </Providers>
  );
}
export default MyApp;
