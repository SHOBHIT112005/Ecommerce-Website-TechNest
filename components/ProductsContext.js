import { createContext, useCallback, useState } from "react";
import uselocalStorageState from 'use-local-storage-state'

export const ProductsContext = createContext({});

export function ProductsContextProvider({children}) {
    const [selectedProducts , setSelectedProducts] = uselocalStorageState('cart',{defaultValue : []});
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
