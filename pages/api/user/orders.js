import { initMongoose } from "@/lib/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import Order from "@/models/Order";
import User from "@/models/User";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      res.status(401).json({ error: "Please sign in to view your orders" });
      return;
    }

    await initMongoose();
    const emailLower = session.user.email.toLowerCase();

    const user = await User.findOne({ emailLower }).select("_id").lean();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ orders });
  } catch (error) {
    console.error("User orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}