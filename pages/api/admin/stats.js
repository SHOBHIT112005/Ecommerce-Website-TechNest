import { initMongoose } from "@/lib/mongoose";
import { requireAdminApi } from "@/lib/adminAuth";
import { applyRateLimit } from "@/lib/rateLimit";
import Order from "@/models/Order";
import User from "@/models/User";

export default async function handler(req, res) {
  try {
    const allowed = applyRateLimit(req, res, {
      keyPrefix: "admin-stats",
      windowMs: 60 * 1000,
      maxRequests: 60,
    });
    if (!allowed) return;

    await initMongoose();
    const adminSession = await requireAdminApi(req, res);
    if (!adminSession) return;

    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const [summary = {}] = await Order.aggregate([
      {
        $addFields: {
          normalizedTotal: {
            $ifNull: [
              "$totalAmount",
              {
                $add: [
                  { $ifNull: ["$subtotal", 0] },
                  { $ifNull: ["$deliveryFee", 5] },
                ],
              },
            ],
          },
          normalizedStatus: {
            $ifNull: [
              "$status",
              { $cond: [{ $eq: ["$paid", 1] }, "completed", "pending"] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          paidOrders: { $sum: { $cond: [{ $eq: ["$paid", 1] }, 1, 0] } },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$normalizedStatus", "pending"] }, 1, 0] },
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$normalizedStatus", "completed"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$normalizedStatus", "cancelled"] }, 1, 0] },
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$paid", 1] }, "$normalizedTotal", 0] },
          },
          averageOrderValue: { $avg: "$normalizedTotal" },
        },
      },
    ]);

    const [userSummary = {}] = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          registeredUsers: {
            $sum: { $cond: [{ $eq: ["$isRegistered", true] }, 1, 0] },
          },
          guestUsers: {
            $sum: { $cond: [{ $eq: ["$isRegistered", true] }, 0, 1] },
          },
        },
      },
    ]);

    const monthlySales = await Order.aggregate([
      { $match: { paid: 1 } },
      {
        $addFields: {
          normalizedTotal: {
            $ifNull: [
              "$totalAmount",
              {
                $add: [
                  { $ifNull: ["$subtotal", 0] },
                  { $ifNull: ["$deliveryFee", 5] },
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$normalizedTotal" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 },
    ]);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name email city paid status totalAmount subtotal deliveryFee createdAt")
      .lean();

    res.json({
      summary: {
        totalOrders: summary.totalOrders || 0,
        paidOrders: summary.paidOrders || 0,
        pendingOrders: summary.pendingOrders || 0,
        completedOrders: summary.completedOrders || 0,
        cancelledOrders: summary.cancelledOrders || 0,
        totalRevenue: summary.totalRevenue || 0,
        averageOrderValue: summary.averageOrderValue || 0,
      },
      users: {
        totalUsers: userSummary.totalUsers || 0,
        registeredUsers: userSummary.registeredUsers || 0,
        guestUsers: userSummary.guestUsers || 0,
      },
      monthlySales,
      recentOrders,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
