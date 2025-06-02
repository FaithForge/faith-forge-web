import { Providers, store } from '@/libs/state/redux';
import { themeVars } from '@/libs/utils/theme';
import type { AppProps } from 'next/app';
import { DM_Sans } from 'next/font/google';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { ConfigProvider } from 'react-vant';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import './theme.css';
const dmSans = DM_Sans({ weight: ['300', '400', '700'], subsets: ['latin'] });

const BLOCKED_ROUTES = ['/', '/admin', '/kid-registration', '/kid-church'];

function MyApp({ Component, pageProps }: AppProps) {
  const persistor = persistStore(store);
  const router = useRouter();

  useEffect(() => {
    router.beforePopState(() => {
      if (BLOCKED_ROUTES.includes(router.pathname)) {
        return false;
      }
      return true;
    });
  }, [router.pathname]);

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
          {/* <SafeArea position="bottom" /> */}
        </PersistGate>
      </ConfigProvider>
    </Providers>
  );
}
export default MyApp;
