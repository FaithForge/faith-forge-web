/* eslint-disable @next/next/no-title-in-document-head */
import Document, { Html, Head, Main, NextScript } from 'next/document';

const prod = process.env.PROD_MANIFEST === 'yes';

class MyDocument extends Document {
  render() {
    const manifest = prod ? '/manifest.json' : '/manifest-dev.json';
    const favicon = prod ? '/icons/icon-192x192.png' : '/icons/icondev-192x192.png';

    return (
      <Html>
        <Head>
          <title>Iglekids</title>
          <link rel="manifest" href={manifest} />
          <link rel="shortcut icon" href={favicon} />
          <link rel="icon" href="/icons/icon-monochrome.svg" type="image/svg+xml" />
          <link rel="mask-icon" href="/icons/icon-monochrome.svg" color="#004863" />
          <link rel="apple-touch-icon" href="/icons/icon-512x512.png" />
          <link rel="icon" sizes="512x512" href="/icons/icon-512x512.png" />
          <meta name="theme-color" content="#004863" media="(prefers-color-scheme: light)" />
          <meta name="theme-color" content="#003642" media="(prefers-color-scheme: dark)" />
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
