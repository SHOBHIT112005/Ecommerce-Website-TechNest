import { createContext, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import uselocalStorageState from 'use-local-storage-state'

export const ProductsContext = createContext({});

export function ProductsContextProvider({children}) {
    const { data: session } = useSession();
    const userEmail = session?.user?.email || null; // null for guests
    // Use email-based key for persistence, but fallback to in-memory for guests
    const [selectedProducts , setSelectedProducts] = uselocalStorageState(
        userEmail ? `cart_${userEmail}` : 'cart_guest',
        { defaultValue: [] }
    );
    const [toastMessage, setToastMessage] = useState(null);

    const addToast = useCallback((message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 2500);
    }, []);

    return(
        <ProductsContext.Provider value={{selectedProducts,setSelectedProducts,toastMessage,addToast}}>
            {children}
        </ProductsContext.Provider>
    )
}