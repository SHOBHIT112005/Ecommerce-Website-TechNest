import Head from "next/head";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import Layout from "./Layout";
import { ProductsContext } from "@/components/ProductsContext";
import Spinner from "@/components/Spinner";

function ConfirmOverlay({ visible, onConfirm, onCancel, total }) {
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

export default function Checkout () {
    const {selectedProducts,setSelectedProducts} = useContext(ProductsContext);
    const [productsInfos,setProductsInfos] = useState([]);
    const [address,setAddress] = useState('');
    const [city,setCity] = useState('');
    const [name,setName] = useState('');
    const [email,setEmail] = useState('');
    const [loading,setLoading] = useState(false);
    const [fetchError,setFetchError] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (selectedProducts.length === 0) {
            setProductsInfos([]);
            return;
        }
        setLoading(true);
        setFetchError(false);
        fetch('/api/products?ids='+selectedProducts.join(','))
        .then(response => {
            if (!response.ok) throw new Error('Failed to load products');
            return response.json();
        })
        .then(json => setProductsInfos(json))
        .catch(err => {
            console.error('Failed to fetch products:', err);
            setFetchError(true);
        })
        .finally(() => setLoading(false));
    },[selectedProducts])

    function moreofThis(id) {
        setSelectedProducts(prev =>[...prev , id]);
    }

    function lessofThis(id) {
        const pos = selectedProducts.indexOf(id);
        if(pos !== -1) {
            setSelectedProducts(prev => {
                return prev.filter((value,index) => index !== pos);
            })
        }
    }


    const deliveryPrice = 5;
    let subtotal = 0;
    if (selectedProducts?.length) {
    for (let id of selectedProducts) {
            const price = productsInfos.find(p => p._id === id)?.price || 0;
            subtotal += price;
        }
    }
    const total = subtotal + deliveryPrice;



    return(
        <Layout>
            <Head>
                <title>Technest - Checkout</title>
            </Head>
            {loading && (
                <Spinner />
            )}
            {!loading && selectedProducts.length === 0 && (
                <div>No Products in your cart.</div>
            )}
            {!loading && fetchError && (
                <div className="text-red-500 text-center py-4">Failed to load cart. Please try again.</div>
            )}
            {!loading && !fetchError && selectedProducts.length > 0 && productsInfos.length > 0 && productsInfos.filter(p => selectedProducts.filter(id => id === p._id).length > 0)
                .map(productsInfo => {
            return (
            <div className="flex mb-5" key={productsInfo._id}>
                <div className="bg-gray-100 p-3 rounded-xl shrink-0">
                    <Image className="w-24" src={productsInfo.picture} alt={productsInfo.name} width={96} height={96} />
                </div>
                <div className="pl-4 flex-grow">
                    <h3 className="font-bold text-lg">{productsInfo.name}</h3>
                    <p className="text-sm leading-4 text-gray-600">{productsInfo.description}</p>
                    <div className="flex justify-between items-center mt-2">
                        <div className="text-md font-semibold">${productsInfo.price}</div>
                            <div>
                                <button onClick={() => lessofThis(productsInfo._id)} className="border border-emerald-500 px-2 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors">-</button>
                                <span className="px-2">
                                    {selectedProducts.filter(id => id === productsInfo._id).length}
                                </span>
                                <button
                                    onClick={() => moreofThis(productsInfo._id)}
                                    className="bg-emerald-500 px-2 rounded-lg text-white hover:bg-emerald-600 transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )})}
            {!loading && !fetchError && selectedProducts.length > 0 && productsInfos.filter(p => selectedProducts.filter(id => id === p._id).length > 0).length === 0 && (
                <div className="text-yellow-600 text-center py-4">
                    Some items in your cart are no longer available.
                </div>
            )}

            {!loading && !fetchError && selectedProducts.length > 0 && (
              <form action="/api/checkout" method="POST" className="mt-4">
                <div>
                  <input name="address" value={address} onChange={e => setAddress(e.target.value)} className="bg-gray-100 w-full rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" type="text" placeholder="Street address, number"/>

                  <input name="city" value={city} onChange={e => setCity(e.target.value)} className="bg-gray-100 w-full rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" type="text" placeholder="City and postal code"/>

                  <input name="name" value={name} onChange={e => setName(e.target.value)} className="bg-gray-100 w-full rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" type="text" placeholder="Name"/>

                  <input name="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-gray-100 w-full rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" type="text" placeholder="Email address"/>
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
                <input type="hidden" name="products" value={selectedProducts.join(',')}/>

                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  className="bg-emerald-500 px-5 py-2 rounded-xl font-bold text-white w-full my-4 shadow-emerald-300 shadow-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  Pay ${total}
                </button>
              </form>
            )}

            <ConfirmOverlay
              visible={showConfirm}
              total={total}
              onConfirm={() => {
                setShowConfirm(false);
                // Submit the form programmatically
                const form = document.querySelector('form');
                form?.requestSubmit();
              }}
              onCancel={() => setShowConfirm(false)}
            />
    </Layout>
    )
}
