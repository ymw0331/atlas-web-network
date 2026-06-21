import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className={`antialiased dark`}>
      <Head>
        <link rel="icon" href="/favicon.ico?v=2" />
        <meta name="description" content="Atlas - Internal operations platform" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
