import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className={`antialiased dark`}>
      <Head>
        <meta name="description" content="Atlas - Internal operations platform" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
