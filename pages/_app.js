import { ProductsContextProvider } from "../components/ProductsContext";
import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ProductsContextProvider>
        <Component {...pageProps} />
      </ProductsContextProvider>
    </SessionProvider>
  );
}
