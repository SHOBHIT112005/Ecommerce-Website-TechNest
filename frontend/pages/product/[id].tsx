import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/pages/Layout";
import productDescriptions from "@/lib/productDescriptions";
import { serverApiGet } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import { addItem, showToast, clearToast } from "@/store/cartSlice";
import type { GetServerSideProps } from "next";
import type { Product, ProductDisplay } from "@/types";

interface ProductPageProps {
  product: ProductDisplay | null;
}

export default function ProductPage({ product }: ProductPageProps) {
  const dispatch = useAppDispatch();
  const detailedDescription = product ? ((productDescriptions as Record<string, string>)[product.name] ?? product.description) : "";
  const metaDescription = detailedDescription ? detailedDescription.split("\n")[0] : "";

  if (!product) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">Product not found.</p>
          <Link href="/" className="text-emerald-500 underline mt-4 inline-block">Back to Home</Link>
        </div>
      </Layout>
    );
  }

  function addToCart() {
    dispatch(addItem(product!.id));
    dispatch(showToast(`${product!.name} successfully added to cart`));
    setTimeout(() => dispatch(clearToast()), 2500);
  }

  return (
    <Layout chatProductId={product.id}>
      <Head>
        <title>{product.name} - Technest</title>
        <meta name="description" content={metaDescription} />
      </Head>

      <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-500 transition-colors mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Home
      </Link>

      <div className="flex flex-col gap-8">
        <div className="w-full bg-blue-100 rounded-xl flex items-center justify-center p-8 h-80 md:h-96">
          <Image src={product.picture} alt={product.name} width={400} height={400} className="object-contain w-full h-full" />
        </div>

        <div className="w-full">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-3xl font-bold text-emerald-600 mt-3">${product.price}</p>

          <div className="flex flex-wrap gap-2 mt-4">
            {product.categories.map(cat => (
              <span key={cat} className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">{cat}</span>
            ))}
          </div>

          <p className="text-gray-600 mt-6 leading-relaxed whitespace-pre-line">{detailedDescription}</p>
        </div>

        <button
          onClick={addToCart}
          className="bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 w-full md:w-auto text-lg flex items-center justify-center gap-2 mb-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add to Cart
        </button>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<ProductPageProps> = async ({ params }) => {
  try {
    const rawProduct = await serverApiGet<Product>(`/api/products/${params?.id}`);

    // Flatten categories for display
    const product: ProductDisplay = {
      ...rawProduct,
      categories: rawProduct.categories?.map(c => c.name) || [],
    };

    return {
      props: { product },
    };
  } catch {
    return { props: { product: null } };
  }
};
