import { initMongoose } from "@/lib/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import Order from "@/models/Order";
import User from "@/models/User";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      res.status(401).json({ error: "Please sign in to manage orders" });
      return;
    }

    await initMongoose();

    const { id } = req.query;

    if (req.method === "DELETE") {
      // Cancel an order (only if pending and not paid)
      const order = await Order.findOne({ _id: id }).lean();

      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      // Verify ownership
      const emailLower = session.user.email.toLowerCase();
      const user = await User.findOne({ emailLower }).select("_id").lean();
      if (!user || order.user?.toString() !== user._id.toString()) {
        res.status(403).json({ error: "Not authorized to cancel this order" });
        return;
      }

      // Only allow cancellation if order is pending and not paid
      if (order.paid) {
        res.status(400).json({ error: "Cannot cancel a paid order" });
        return;
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { status: "cancelled" },
        { new: true }
      ).lean();

      res.json({ order: updatedOrder });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}