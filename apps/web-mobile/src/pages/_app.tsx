import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import Setup from './_setup';
import { ConfigProvider } from 'react-vant';
import './theme.css';
import { Providers, store } from '@faith-forge-web/state/redux';
import { DM_Sans } from 'next/font/google';
import { themeVars } from '../utils/theme';
const dmSans = DM_Sans({ weight: ['300', '400', '700'], subsets: ['latin'] });

function MyApp({ Component, pageProps }: AppProps) {
  const persistor = persistStore(store);

  return (
    <Providers>
      <ConfigProvider themeVars={themeVars} className={dmSans.className}>
        <PersistGate loading={null} persistor={persistor}>
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
            />
            <meta name="HandheldFriendly" content="true" />
          </Head>
          {/* <SafeArea position="top" /> */}
          <Component {...pageProps} />
          <Setup />
          {/* <SafeArea position="bottom" /> */}
        </PersistGate>
      </ConfigProvider>
    </Providers>
  );
}
export default MyApp;
