import Head from "next/head";
import { useContext, useEffect, useState } from "react";
import Layout from "@/pages/Layout";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import Link from "next/link";
import { ProductsContext } from "@/components/ProductsContext";

function ConfirmCancelOverlay({ visible, onConfirm, onCancel, orderTotal }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-3">Confirm Order Cancellation</h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to cancel this order? The amount of <strong>${orderTotal}</strong> will be refunded to your account in 3-5 business days.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            No, Keep Order
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
          >
            Yes, Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "-";
  }
}

export default function MyOrders({ userEmail }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [justCompletedOrderId, setJustCompletedOrderId] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const { addToast } = useContext(ProductsContext);

  useEffect(() => {
    // Check if returning from Stripe checkout with success
    const params = new URLSearchParams(window?.location?.search || "");
    const justCompleted = params.get("refresh") === "orders";

    async function loadOrders() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/user/orders");
        if (!response.ok) {
          throw new Error("Failed to load orders");
        }
        const data = await response.json();
        setOrders(data.orders || []);
        // If we just completed an order, find and highlight it
        if (justCompleted && data.orders?.length) {
          const latestOrder = data.orders[0];
          if (latestOrder?.paid && latestOrder?.status === "completed") {
            setJustCompletedOrderId(latestOrder._id);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Could not load your orders.");
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  async function cancelOrder(orderId) {
    const order = orders.find((o) => o._id === orderId);
    if (!order) return;
    setOrderToCancel(order);
    setShowCancelConfirm(true);
  }

  async function confirmCancelOrder() {
    if (!orderToCancel) return;
    const orderId = orderToCancel._id;

    try {
      const response = await fetch(`/api/user/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel order");
      }

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status: "cancelled" } : o
        )
      );
      addToast(
        `Your order is successfully cancelled and amount ${formatCurrency(orderToCancel.totalAmount || (orderToCancel.subtotal || 0) + (orderToCancel.deliveryFee || 5))} is being returned to your bank in 3-5 business days.`
      );
      setShowCancelConfirm(false);
      setOrderToCancel(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to cancel order.");
      setShowCancelConfirm(false);
      setOrderToCancel(null);
    }
  }

  return (
    <Layout>
      <Head>
        <title>My Orders - Technest</title>
        <meta name="description" content="Track your order history at Technest" />
      </Head>

      <div className="pb-4 mb-6">
        <h1 className="text-3xl font-bold pb-1">My Orders</h1>
        <p className="text-gray-600">Signed in as {userEmail}</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-600">Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
          {justCompletedOrderId && (
            <p className="text-emerald-600 mb-2">Your recent order has been processed!</p>
          )}
          <Link
            href="/"
            className="inline-block bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = order.status || (order.paid ? "completed" : "pending");
            return (
              <div key={order._id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Order #{order._id.slice(-8)}</h3>
                    <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 sm:mt-0 ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Delivery Address</p>
                    <p className="text-sm">{order.address || "-"}</p>
                    <p className="text-sm">{order.city || "-"}</p>
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {formatCurrency(order.totalAmount || (order.subtotal || 0) + (order.deliveryFee || 5))}
                    </p>
                    <p className="text-xs">
                      {order.paid ? (
                        <span className="text-green-600">Paid</span>
                      ) : (
                        <span className="text-gray-600">Unpaid</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Order Items Preview */}
                {order.products && order.products.length > 0 ? (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-500 mb-2">Items:</p>
                    <div className="flex flex-wrap gap-2">
                      {order.products.map((product, index) => (
                        <span key={index} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                          {product.price_data?.product_data?.name || "Product"} × {product.quantity || 1}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Cancel Button - Only for pending, unpaid orders */}
                {status === "pending" && !order.paid && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => cancelOrder(order._id)}
                      className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmCancelOverlay
        visible={showCancelConfirm}
        orderTotal={orderToCancel?.totalAmount || (orderToCancel?.subtotal || 0) + (orderToCancel?.deliveryFee || 5) || 0}
        onConfirm={confirmCancelOrder}
        onCancel={() => {
          setShowCancelConfirm(false);
          setOrderToCancel(null);
        }}
      />

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to Shop
        </Link>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req, res }) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=/my-orders",
        permanent: false,
      },
    };
  }

  return {
    props: {
      userEmail: session.user.email || session.user.name,
    },
  };
}