import Head from "next/head";
import Header from "../components/Header";
import Toast from "../components/Toast";
import ChatBot from "../components/ChatBot";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearCart } from "@/store/cartSlice";
import type { ReactNode } from "react";

interface LayoutProps {
    children: ReactNode;
    chatProductId?: number;
}

export default function Layout({ children, chatProductId }: LayoutProps) {
    const [success, setSuccess] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const toastMessage = useAppSelector(state => state.cart.toastMessage);
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            dispatch(clearCart());
            setSuccess(true);
            setTimeout(() => {
                window.location.href = "/my-orders";
            }, 2000);
        }
    }, [dispatch]);

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
    );
}
