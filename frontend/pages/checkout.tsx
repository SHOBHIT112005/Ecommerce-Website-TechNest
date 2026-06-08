import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import Layout from "./Layout";
import Spinner from "@/components/Spinner";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { addItem, removeItem, clearCart, showToast, clearToast } from "@/store/cartSlice";
import { apiGet, apiPost } from "@/lib/api";
import { useSession } from "next-auth/react";
import type { Product, CheckoutResponse } from "@/types";

interface ConfirmOverlayProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  total: number;
}

function ConfirmOverlay({ visible, onConfirm, onCancel, total }: ConfirmOverlayProps) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-3">Confirm Your Order</h3>
        <p className="text-gray-600 mb-4">
          You will be redirected to Stripe to complete your payment of <strong>${total}</strong>.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-semibold"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
    const cartItems = useAppSelector(state => state.cart.items);
    const dispatch = useAppDispatch();
    const { data: session } = useSession();
    const [productsInfos, setProductsInfos] = useState<Product[]>([]);
    const [address, setAddress] = useState<string>('');
    const [city, setCity] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>(session?.user?.email || '');
    const [loading, setLoading] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<boolean>(false);
    const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        if (cartItems.length === 0) {
            setProductsInfos([]);
            return;
        }
        setLoading(true);
        setFetchError(false);
        apiGet<Product[]>('/api/products?ids=' + cartItems.join(','))
          .then(data => setProductsInfos(data))
          .catch(err => {
              console.error('Failed to fetch products:', err);
              setFetchError(true);
          })
          .finally(() => setLoading(false));
    }, [cartItems]);

    // Pre-fill email from session
    useEffect(() => {
      if (session?.user?.email && !email) {
        setEmail(session.user.email);
      }
    }, [session, email]);

    function moreOfThis(id: number) {
        dispatch(addItem(id));
    }

    function lessOfThis(id: number) {
        dispatch(removeItem(id));
    }

    const deliveryPrice = 5;
    let subtotal = 0;
    if (cartItems?.length) {
        for (const id of cartItems) {
            const price = productsInfos.find(p => p.id === id)?.price || 0;
            subtotal += price;
        }
    }
    const total = subtotal + deliveryPrice;

    async function handleCheckout() {
        setSubmitting(true);
        try {
            // Call through the Next.js proxy which handles auth via session
            const res = await fetch('/api/proxy/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    address,
                    city,
                    products: cartItems.join(','),
                }),
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.error || 'Checkout failed');
            }

            if (result.url) {
                // Clear cart before redirecting to Stripe
                dispatch(clearCart());
                window.location.href = result.url;
            }
        } catch (err) {
            console.error('Checkout error:', err);
            dispatch(showToast((err as Error).message || 'Checkout failed. Please try again.'));
            setTimeout(() => dispatch(clearToast()), 3000);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Layout>
            <Head>
                <title>Technest - Checkout</title>
            </Head>
            {loading && (
                <Spinner />
            )}
            {!loading && cartItems.length === 0 && (
                <div>No Products in your cart.</div>
            )}
            {!loading && fetchError && (
                <div className="text-red-500 text-center py-4">Failed to load cart. Please try again.</div>
            )}
            {!loading && !fetchError && cartItems.length > 0 && productsInfos.length > 0 && productsInfos.filter(p => cartItems.includes(p.id))
                .map(productsInfo => {
            return (
            <div className="flex mb-5" key={productsInfo.id}>
                <div className="bg-gray-100 p-3 rounded-xl shrink-0">
                    <Image className="w-24" src={productsInfo.picture} alt={productsInfo.name} width={96} height={96} />
                </div>
                <div className="pl-4 flex-grow">
                    <h3 className="font-bold text-lg">{productsInfo.name}</h3>
                    <p className="text-sm leading-4 text-gray-600">{productsInfo.description}</p>
                    <div className="flex justify-between items-center mt-2">
                        <div className="text-md font-semibold">${productsInfo.price}</div>
                            <div>
                                <button onClick={() => lessOfThis(productsInfo.id)} className="border border-emerald-500 px-2 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors">-</button>
                                <span className="px-2">
                                    {cartItems.filter(id => id === productsInfo.id).length}
                                </span>
                                <button
                                    onClick={() => moreOfThis(productsInfo.id)}
                                    className="bg-emerald-500 px-2 rounded-lg text-white hover:bg-emerald-600 transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )})}
            {!loading && !fetchError && cartItems.length > 0 && productsInfos.filter(p => cartItems.includes(p.id)).length === 0 && (
                <div className="text-yellow-600 text-center py-4">
                    Some items in your cart are no longer available.
                </div>
            )}

            {!loading && !fetchError && cartItems.length > 0 && (
              <div className="mt-4">
                <div>
                  <input value={address} onChange={e => setAddress(e.target.value)} className="bg-gray-100 w-full rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" type="text" placeholder="Street address, number"/>
                  <input value={city} onChange={e => setCity(e.target.value)} className="bg-gray-100 w-full rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" type="text" placeholder="City and postal code"/>
                  <input value={name} onChange={e => setName(e.target.value)} className="bg-gray-100 w-full rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" type="text" placeholder="Name"/>
                  <input value={email} onChange={e => setEmail(e.target.value)} className="bg-gray-100 w-full rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" type="email" placeholder="Email address"/>
                </div>

                <div className="mt-8">
                  <div className="flex my-3">
                    <h3 className="grow font-bold text-gray-400">Subtotal:</h3>
                    <h3 className="font-bold">${subtotal}</h3>
                  </div>
                  <div className="flex my-3">
                    <h3 className="grow font-bold text-gray-400">Delivery:</h3>
                    <h3 className="font-bold">${deliveryPrice}</h3>
                  </div>
                  <div className="flex my-3 border-t pt-3 border-dashed border-emerald-500">
                    <h3 className="grow font-bold text-gray-400">Total:</h3>
                    <h3 className="font-bold">${total}</h3>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                      if (!name.trim() || !address.trim() || !city.trim()) {
                          dispatch(showToast('Please fill in your Name, Address, and City to proceed.'));
                          setTimeout(() => dispatch(clearToast()), 3000);
                          return;
                      }
                      setShowConfirm(true);
                  }}
                  className="bg-emerald-500 px-5 py-2 rounded-xl font-bold text-white w-full my-4 shadow-emerald-300 shadow-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-60"
                >
                  {submitting ? 'Processing...' : `Pay $${total}`}
                </button>
              </div>
            )}

            <ConfirmOverlay
              visible={showConfirm}
              total={total}
              onConfirm={() => {
                setShowConfirm(false);
                handleCheckout();
              }}
              onCancel={() => setShowConfirm(false)}
            />
    </Layout>
    );
}
