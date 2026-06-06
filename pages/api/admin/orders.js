import { initMongoose } from "@/lib/mongoose";
import { requireAdminApi } from "@/lib/adminAuth";
import { applyRateLimit } from "@/lib/rateLimit";
import Order from "@/models/Order";
import User from "@/models/User";

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function getOrCreateUserForOrder({ name, email }) {
  const emailLower = email.trim().toLowerCase();
  return User.findOneAndUpdate(
    { emailLower },
    {
      $set: {
        name: name?.trim() || "",
        email: email.trim(),
        emailLower,
        authProvider: "admin",
        isRegistered: false,
      },
      $setOnInsert: {
        role: "user",
        orderHistory: [],
      },
    },
    { upsert: true, new: true },
  ).exec();
}

export default async function handler(req, res) {
  try {
    const allowed = applyRateLimit(req, res, {
      keyPrefix: "admin-orders",
      windowMs: 60 * 1000,
      maxRequests: 120,
    });
    if (!allowed) return;

    await initMongoose();
    const adminSession = await requireAdminApi(req, res);
    if (!adminSession) return;

    if (req.method === "GET") {
      const limit = Math.min(toNumber(req.query.limit, 50), 200);
      const statusFilter = req.query.status;
      const filter = {};
      if (statusFilter && ["pending", "completed", "cancelled"].includes(statusFilter)) {
        filter.status = statusFilter;
      }

      const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("name email city address products paid status subtotal deliveryFee totalAmount createdAt updatedAt")
        .lean();

      res.json({ orders });
      return;
    }

    if (req.method === "PATCH") {
      const { orderId, status, paid } = req.body || {};
      if (!orderId) {
        res.status(400).json({ error: "orderId is required" });
        return;
      }

      const update = {};
      if (status) {
        if (!["pending", "completed", "cancelled"].includes(status)) {
          res.status(400).json({ error: "Invalid status value" });
          return;
        }
        update.status = status;
        if (status === "completed" && typeof paid === "undefined") {
          update.paid = 1;
        }
      }

      if (typeof paid !== "undefined") {
        update.paid = paid ? 1 : 0;
      }

      const updatedOrder = await Order.findByIdAndUpdate(orderId, update, { new: true }).lean();
      if (!updatedOrder) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      res.json({ order: updatedOrder });
      return;
    }

    if (req.method === "DELETE") {
      const orderId = req.query.orderId || req.body?.orderId;
      if (!orderId) {
        res.status(400).json({ error: "orderId is required" });
        return;
      }

      const order = await Order.findByIdAndDelete(orderId).lean();
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      if (order.user) {
        await User.findByIdAndUpdate(order.user, { $pull: { orderHistory: order._id } }).exec();
      }

      res.json({ success: true });
      return;
    }

    if (req.method === "POST") {
      const { name, email, address, city, subtotal, deliveryFee, status, paid } = req.body || {};
      if (!name?.trim() || !email?.trim()) {
        res.status(400).json({ error: "name and email are required" });
        return;
      }
      if (!email.includes("@")) {
        res.status(400).json({ error: "Valid email is required" });
        return;
      }

      const safeSubtotal = Math.max(0, toNumber(subtotal, 0));
      const safeDelivery = Math.max(0, toNumber(deliveryFee, 0));
      const safeStatus = ["pending", "completed", "cancelled"].includes(status) ? status : "pending";
      const safePaid = typeof paid === "undefined" ? (safeStatus === "completed" ? 1 : 0) : (paid ? 1 : 0);

      const userDoc = await getOrCreateUserForOrder({ name, email });
      const order = await Order.create({
        products: [],
        name: name.trim(),
        email: email.trim(),
        user: userDoc?._id || null,
        address: address?.trim() || "",
        city: city?.trim() || "",
        status: safeStatus,
        subtotal: safeSubtotal,
        deliveryFee: safeDelivery,
        totalAmount: safeSubtotal + safeDelivery,
        paid: safePaid,
      });

      if (userDoc?._id) {
        await User.findByIdAndUpdate(userDoc._id, { $addToSet: { orderHistory: order._id } }).exec();
      }

      res.status(201).json({ order });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Admin orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
