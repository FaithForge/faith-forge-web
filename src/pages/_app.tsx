import React from 'react';
import type { AppProps } from 'next/app';
import { SafeArea } from 'antd-mobile';
import Head from 'next/head';
import { Providers } from '../redux/provider';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { store } from '../redux/store';

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
        <SafeArea position="top" />
        <Component {...pageProps} />
        <SafeArea position="bottom" />
      </PersistGate>
    </Providers>
  );
}
export default MyApp;
