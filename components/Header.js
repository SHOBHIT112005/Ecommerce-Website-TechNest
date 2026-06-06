import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useContext } from "react";
import { ProductsContext } from "./ProductsContext";

export default function Header() {
  const { data: session, status } = useSession();
  const userLabel = session?.user?.name || session?.user?.email || "Signed in";
  const isAdmin = session?.user?.role === "admin";
  const { selectedProducts } = useContext(ProductsContext);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-5">
      <div className="max-w-6xl mx-auto flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-emerald-600">Technest</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="hidden sm:inline">Home</span>
          </Link>
          {status === "authenticated" && !isAdmin ? (
            <Link
              href="/my-orders"
              className="hidden sm:flex items-center gap-1 text-sm font-semibold bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              My Orders
            </Link>
          ) : null}
          {status === "authenticated" && isAdmin ? (
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1 text-sm font-semibold bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              Admin
            </Link>
          ) : null}
          <Link
            href="/checkout"
            className="relative flex items-center gap-1 text-sm font-semibold bg-emerald-500 text-white px-3 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            {selectedProducts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {selectedProducts.length}
              </span>
            )}
          </Link>
          {status === "authenticated" ? (
            <>
              <span className="hidden sm:inline text-sm text-gray-600 max-w-44 truncate" title={userLabel}>
                {userLabel}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm font-semibold bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="text-sm font-semibold bg-emerald-500 text-white px-3 py-2 rounded-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              Sign In / Sign Up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}