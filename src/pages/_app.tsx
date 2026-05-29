import { Providers, store } from '@/libs/state/redux';
import { themeVars } from '@/libs/utils/theme';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { ConfigProvider } from 'react-vant';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import './theme.css';
import { Toaster } from 'sonner';

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
  }, [router]);

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
          {/* <SafeArea position="top" /> */}
          <Component {...pageProps} />
          <Toaster
            position="bottom-center"
            toastOptions={{
              classNames: {
                info: '!bg-blue-700',
                success: '!bg-green-700',
                error: '!bg-red-700',
              },
            }}
          />
          {/* <SafeArea position="bottom" /> */}
        </PersistGate>
      </ConfigProvider>
    </Providers>
  );
}
export default MyApp;
