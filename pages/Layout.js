import Head from "next/head";
import Header from "../components/Header";
import Toast from "../components/Toast";
import ChatBot from "../components/ChatBot";
import { ProductsContext } from "../components/ProductsContext";
import { useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function Layout ({children, chatProductId}) {
    const [success,setSuccess] = useState(false);
    const {setSelectedProducts, toastMessage} = useContext(ProductsContext);
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            setSelectedProducts([]);
            setSuccess(true);
            // Auto-redirect to my-orders after 2 seconds so user can see completed status
            setTimeout(() => {
                window.location.href = "/my-orders";
            }, 2000);
        }
    },[setSelectedProducts])
    return (
        <div className="min-h-screen flex flex-col">
            <Head>
                <title>Technest - Your Tech Store</title>
                <meta name="description" content="Shop the latest tech products at Technest" />
            </Head>
            <Toast message={toastMessage} />
            <Header />
            {success && (
                <div className="px-5">
                    <div className="max-w-6xl mx-auto mb-5 bg-green-400 text-white text-lg p-5 rounded-xl">
                        Thanks for your order! Redirecting to your orders...
                    </div>
                </div>
            )}
            <div className="flex-grow px-5">
                <div className="max-w-6xl mx-auto pt-6">
                    {children}
                </div>
            </div>
            {!isAdmin && <ChatBot currentProductId={chatProductId} />}
        </div>
    )

}