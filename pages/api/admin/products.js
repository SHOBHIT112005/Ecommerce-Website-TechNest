import { initMongoose } from "@/lib/mongoose";
import { requireAdminApi } from "@/lib/adminAuth";
import { applyRateLimit } from "@/lib/rateLimit";
import Product from "@/models/Products";

function toPrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function normalizeCategories(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function handler(req, res) {
  try {
    const allowed = applyRateLimit(req, res, {
      keyPrefix: "admin-products",
      windowMs: 60 * 1000,
      maxRequests: 120,
    });
    if (!allowed) return;

    await initMongoose();
    const adminSession = await requireAdminApi(req, res);
    if (!adminSession) return;

    if (req.method === "GET") {
      const products = await Product.find()
        .sort({ createdAt: -1, name: 1 })
        .select("name description price categories picture")
        .lean();

      res.json({ products });
      return;
    }

    if (req.method === "POST") {
      const { name, description, price, categories, picture } = req.body || {};
      const cleanName = String(name || "").trim();
      const cleanDescription = String(description || "").trim();
      const cleanPicture = String(picture || "").trim();
      const cleanCategories = normalizeCategories(categories);
      const cleanPrice = toPrice(price);

      if (!cleanName) {
        res.status(400).json({ error: "Product name is required" });
        return;
      }
      if (!cleanDescription) {
        res.status(400).json({ error: "Product description is required" });
        return;
      }
      if (cleanPrice === null) {
        res.status(400).json({ error: "Valid product price is required" });
        return;
      }
      if (cleanCategories.length === 0) {
        res.status(400).json({ error: "At least one category is required" });
        return;
      }
      if (!cleanPicture.startsWith("/products/")) {
        res.status(400).json({ error: "Picture path must start with /products/" });
        return;
      }

      const product = await Product.create({
        name: cleanName,
        description: cleanDescription,
        price: cleanPrice,
        categories: cleanCategories,
        picture: cleanPicture,
      });

      res.status(201).json({ product });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Admin products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
