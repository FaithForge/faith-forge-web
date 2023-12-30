/* eslint-disable @next/next/no-title-in-document-head */
import Document, { Html, Head, Main, NextScript } from 'next/document';

const prod = process.env.WEB_ENV === 'production';

class MyDocument extends Document {
  render() {
    const manifest = prod ? '/manifest.json' : '/manifest-dev.json';
    const favicon = prod
      ? '/icons/icon-192x192.png'
      : '/icons/icondev-192x192.png';

    return (
      <Html>
        <Head>
          <title>Iglekids</title>
          <link rel="manifest" href={manifest} />
          <link rel="shortcut icon" href={favicon} />
          <meta name="theme-color" content="#fff" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
