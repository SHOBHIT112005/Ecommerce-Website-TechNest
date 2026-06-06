import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import Layout from "@/pages/Layout";
import { getServerSessionWithRole } from "@/lib/adminAuth";

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

export default function AdminDashboard({ adminUser }) {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusDrafts, setStatusDrafts] = useState({});
  const [paidDrafts, setPaidDrafts] = useState({});
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [manualOrder, setManualOrder] = useState({
    name: "",
    email: "",
    city: "",
    address: "",
    subtotal: "",
    deliveryFee: "5",
    status: "pending",
  });
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    categories: "",
    picture: "/products/",
    description: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  async function loadDashboardData() {
    setLoading(true);
    setError("");
    try {
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/orders?limit=100"),
        fetch("/api/admin/products"),
      ]);

      if (!statsRes.ok || !ordersRes.ok || !productsRes.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const statsJson = await statsRes.json();
      const ordersJson = await ordersRes.json();
      const productsJson = await productsRes.json();
      setStats(statsJson);
      setOrders(ordersJson.orders || []);
      setProducts(productsJson.products || []);
    } catch (err) {
      console.error(err);
      setError("Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const status = {};
    const paid = {};
    for (const order of orders) {
      status[order._id] = order.status || (order.paid ? "completed" : "pending");
      paid[order._id] = !!order.paid;
    }
    setStatusDrafts(status);
    setPaidDrafts(paid);
  }, [orders]);

  const salesByMonth = useMemo(() => {
    if (!stats?.monthlySales?.length) return [];
    return [...stats.monthlySales]
      .reverse()
      .map((entry) => ({
        label: `${entry._id.month}/${entry._id.year}`,
        revenue: entry.revenue,
        orders: entry.orders,
      }));
  }, [stats]);

  async function saveOrderTracking(orderId) {
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: statusDrafts[orderId],
          paid: paidDrafts[orderId],
        }),
      });
      if (!response.ok) throw new Error("Failed to update order");
      // Immediately update local state to reflect the save without waiting for reload
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? { ...order, status: statusDrafts[orderId], paid: paidDrafts[orderId] ? 1 : 0 }
            : order
        )
      );
      // Clear the drafts for this order to match new state
      setStatusDrafts((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      setPaidDrafts((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    } catch (err) {
      console.error(err);
      setError("Failed to update order.");
    }
  }

  async function removeOrder(orderId) {
    const ok = window.confirm("Delete this order permanently?");
    if (!ok) return;
    try {
      const response = await fetch(`/api/admin/orders?orderId=${orderId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete order");
      // Immediately remove from local state
      setOrders((prev) => prev.filter((order) => order._id !== orderId));
      // Also clean up drafts
      setStatusDrafts((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      setPaidDrafts((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    } catch (err) {
      console.error(err);
      setError("Failed to delete order.");
    }
  }

  async function createManualOrder(e) {
    e.preventDefault();
    setCreatingOrder(true);
    setError("");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualOrder,
          subtotal: Number(manualOrder.subtotal || 0),
          deliveryFee: Number(manualOrder.deliveryFee || 0),
        }),
      });
      if (!response.ok) throw new Error("Failed to create order");
      setManualOrder({
        name: "",
        email: "",
        city: "",
        address: "",
        subtotal: "",
        deliveryFee: "5",
        status: "pending",
      });
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      setError("Failed to create order.");
    } finally {
      setCreatingOrder(false);
    }
  }

  async function createProduct(e) {
    e.preventDefault();
    setCreatingProduct(true);
    setError("");
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price || 0),
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || "Failed to create product");

      setNewProduct({
        name: "",
        price: "",
        categories: "",
        picture: "/products/",
        description: "",
      });
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create product.");
    } finally {
      setCreatingProduct(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>Admin Dashboard - Technest</title>
      </Head>

      <div className="pb-4 mb-6">
        <h1 className="text-3xl font-bold pb-1">Admin Dashboard</h1>
        <p className="text-gray-600">Signed in as {adminUser}</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-600">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500">Revenue</div>
              <div className="text-xl font-bold">{formatCurrency(stats?.summary?.totalRevenue)}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500">Orders</div>
              <div className="text-xl font-bold">{stats?.summary?.totalOrders || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500">Pending</div>
              <div className="text-xl font-bold">{stats?.summary?.pendingOrders || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500">Completed</div>
              <div className="text-xl font-bold">{stats?.summary?.completedOrders || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500">Users</div>
              <div className="text-xl font-bold">{stats?.users?.totalUsers || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500">AOV</div>
              <div className="text-xl font-bold">{formatCurrency(stats?.summary?.averageOrderValue)}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500">Products</div>
              <div className="text-xl font-bold">{products.length}</div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Monthly Sales (Paid)</h2>
            {salesByMonth.length === 0 ? (
              <div className="text-gray-500">No paid sales data yet.</div>
            ) : (
              <div className="space-y-2">
                {salesByMonth.map((row) => (
                  <div key={row.label} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                    <div className="font-medium">{row.label}</div>
                    <div className="text-sm text-gray-600">{row.orders} orders</div>
                    <div className="font-semibold">{formatCurrency(row.revenue)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">Add Product</h2>
            <form onSubmit={createProduct} className="grid md:grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
              <input
                required
                value={newProduct.name}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-white rounded-lg px-3 py-2 border border-gray-200"
                placeholder="Product name"
              />
              <input
                required
                value={newProduct.price}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
                className="bg-white rounded-lg px-3 py-2 border border-gray-200"
                placeholder="Price"
                type="number"
                min="0"
                step="0.01"
              />
              <input
                required
                value={newProduct.categories}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, categories: e.target.value }))}
                className="bg-white rounded-lg px-3 py-2 border border-gray-200"
                placeholder="Categories, comma separated"
              />
              <input
                required
                value={newProduct.picture}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, picture: e.target.value }))}
                className="bg-white rounded-lg px-3 py-2 border border-gray-200"
                placeholder="/products/example.png"
              />
              <textarea
                required
                value={newProduct.description}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
                className="bg-white rounded-lg px-3 py-2 border border-gray-200 md:col-span-2 min-h-28"
                placeholder="Product description"
              />
              <button
                type="submit"
                disabled={creatingProduct}
                className="bg-emerald-500 text-white rounded-lg px-3 py-2 font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-60 md:col-span-2"
              >
                {creatingProduct ? "Adding..." : "Add Product"}
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              Image paths must point to files in public/products, for example /products/macbook.png.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">Create Manual Order</h2>
            <form onSubmit={createManualOrder} className="grid md:grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
              <input
                required
                value={manualOrder.name}
                onChange={(e) => setManualOrder((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-white rounded-lg px-3 py-2 border border-gray-200"
                placeholder="Customer name"
              />
              <input
                required
                type="email"
                value={manualOrder.email}
                onChange={(e) => setManualOrder((prev) => ({ ...prev, email: e.target.value }))}
                className="bg-white rounded-lg px-3 py-2 border border-gray-200"
                placeholder="Customer email"
              />
              <input
                value={manualOrder.city}
                onChange={(e) => setManualOrder((prev) => ({ ...prev, city: e.target.value }))}
                className="bg-white rounded-lg px-3 py-2 border border-gray-200"
                placeholder="City"
              />
              <input
                value={manualOrder.address}
                onChange={(e) => setManualOrder((prev) => ({ ...prev, address: e.target.value }))}
                className="bg-white rounded-lg px-3 py-2 border border-gray-200"
                placeholder="Address"
              />
              <input
                value={manualOrder.subtotal}
                onChange={(e) => setManualOrder((prev) => ({ ...prev, subtotal: e.target.value }))}
                className="bg-white rounded-lg px-3 py-2 border border-gray-200"
                placeholder="Subtotal"
                type="number"
                min="0"
                step="0.01"
              />
              <input
                value={manualOrder.deliveryFee}
                onChange={(e) => setManualOrder((prev) => ({ ...prev, deliveryFee: e.target.value }))}
                className="bg-white rounded-lg px-3 py-2 border border-gray-200"
                placeholder="Delivery Fee"
                type="number"
                min="0"
                step="0.01"
              />
              <select
                value={manualOrder.status}
                onChange={(e) => setManualOrder((prev) => ({ ...prev, status: e.target.value }))}
                className="bg-white rounded-lg px-3 py-2 border border-gray-200"
              >
                <option value="pending">pending</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
              <button
                type="submit"
                disabled={creatingOrder}
                className="bg-emerald-500 text-white rounded-lg px-3 py-2 font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-60"
              >
                {creatingOrder ? "Creating..." : "Add Order"}
              </button>
            </form>
          </section>

          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-xl font-semibold">Track and Manage Orders</h2>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="bg-white rounded-lg px-3 py-1 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white rounded-lg px-3 py-1 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Status Legend */}
            <div className="flex gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span>Cancelled</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">City</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Paid</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter((order) => {
                      // Filter by search query
                      if (searchQuery) {
                        const query = searchQuery.toLowerCase();
                        const matchesName = order.name?.toLowerCase().includes(query);
                        const matchesEmail = order.email?.toLowerCase().includes(query);
                        if (!matchesName && !matchesEmail) return false;
                      }
                      // Filter by status
                      if (statusFilter !== "all") {
                        const orderStatus = statusDrafts[order._id] || (order.paid ? "completed" : "pending");
                        if (orderStatus !== statusFilter) return false;
                      }
                      return true;
                    })
                    .map((order) => {
                      const orderStatus = statusDrafts[order._id] || (order.paid ? "completed" : "pending");
                      const statusColors = {
                        pending: "bg-yellow-100 text-yellow-800",
                        completed: "bg-green-100 text-green-800",
                        cancelled: "bg-red-100 text-red-800",
                      };
                      return (
                        <tr key={order._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2">
                            <div className="font-medium">{order.name}</div>
                            <div className="text-gray-500 text-xs">{order.email}</div>
                          </td>
                          <td className="px-3 py-2">{order.city || "-"}</td>
                          <td className="px-3 py-2 font-semibold">
                            {formatCurrency(order.totalAmount || (order.subtotal || 0) + (order.deliveryFee || 0))}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[orderStatus]}`}>
                              {orderStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${order.paid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                              {order.paid ? "Paid" : "Unpaid"}
                            </span>
                          </td>
                          <td className="px-3 py-2">{formatDate(order.createdAt)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <select
                                value={statusDrafts[order._id] || "pending"}
                                onChange={(e) => setStatusDrafts((prev) => ({ ...prev, [order._id]: e.target.value }))}
                                className="bg-white rounded-lg px-2 py-1 border border-gray-200 text-xs"
                              >
                                <option value="pending">pending</option>
                                <option value="completed">completed</option>
                                <option value="cancelled">cancelled</option>
                              </select>
                              <label className="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!paidDrafts[order._id]}
                                  onChange={(e) => setPaidDrafts((prev) => ({ ...prev, [order._id]: e.target.checked }))}
                                />
                                Paid
                              </label>
                              <button
                                onClick={() => saveOrderTracking(order._id)}
                                className="bg-emerald-500 text-white rounded-lg px-2 py-1 hover:bg-emerald-600 transition-colors text-xs"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => removeOrder(order._id)}
                                className="bg-red-500 text-white rounded-lg px-2 py-1 hover:bg-red-600 transition-colors text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {orders.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-gray-500" colSpan={7}>
                        No orders available.
                      </td>
                    </tr>
                  )}
                  {orders.filter((order) => {
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      const matchesName = order.name?.toLowerCase().includes(query);
                      const matchesEmail = order.email?.toLowerCase().includes(query);
                      if (!matchesName && !matchesEmail) return false;
                    }
                    if (statusFilter !== "all") {
                      const orderStatus = statusDrafts[order._id] || (order.paid ? "completed" : "pending");
                      if (orderStatus !== statusFilter) return false;
                    }
                    return true;
                  }).length === 0 && orders.length > 0 && (
                    <tr>
                      <td className="px-3 py-4 text-gray-500" colSpan={7}>
                        No orders match your search/filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </Layout>
  );
}

export async function getServerSideProps({ req, res }) {
  const session = await getServerSessionWithRole(req, res);

  if (!session?.user) {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=/admin",
        permanent: false,
      },
    };
  }

  if (session.user.role !== "admin") {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      adminUser: session.user.name || session.user.email,
    },
  };
}
