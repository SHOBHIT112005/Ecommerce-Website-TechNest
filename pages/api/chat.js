import { initMongoose } from "@/lib/mongoose";
import { applyRateLimit } from "@/lib/rateLimit";
import Product from "@/models/Products";

function compactProduct(product) {
  return {
    id: product._id.toString(),
    name: product.name,
    price: product.price,
    categories: product.categories || [],
    description: product.description || "",
  };
}

function findLocalMatches(message, products, currentProductId) {
  const query = String(message || "").toLowerCase();
  const currentProduct = products.find((product) => product.id === currentProductId);

  if (currentProduct && /recommend|pair|with|accessor|setup|bundle|match/.test(query)) {
    const currentCategories = new Set(currentProduct.categories);
    const recommendations = products
      .filter((product) => product.id !== currentProduct.id)
      .map((product) => {
        const shared = product.categories.filter((category) => currentCategories.has(category)).length;
        const accessoryBoost = product.categories.includes("Accessories") ? 1 : 0;
        const gamingBoost = currentCategories.has("Gaming") && product.categories.includes("Gaming") ? 1 : 0;
        return { product, score: shared + accessoryBoost + gamingBoost };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
      .slice(0, 4)
      .map((item) => `${item.product.name} ($${item.product.price})`);

    if (recommendations.length) {
      return `For ${currentProduct.name}, these pair well: ${recommendations.join("; ")}.`;
    }
  }

  const matches = products
    .filter((product) => {
      const text = `${product.name} ${product.description} ${product.categories.join(" ")}`.toLowerCase();
      return query.split(/\s+/).filter(Boolean).some((word) => text.includes(word));
    })
    .slice(0, 5);

  if (!matches.length) {
    return "I could not find a matching listed product. Try a product name, category, or use words like gaming, laptop, phone, mouse, watch, or monitor.";
  }

  return matches
    .map((product) => `${product.name}: $${product.price}.`)
    .join("\n");
}

async function callOpenRouter({ message, products, currentProductId }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const currentProduct = products.find((product) => product.id === currentProductId) || null;
  const catalog = products
    .map((product) => {
      const categories = product.categories.join(", ");
      return `- ${product.name} | $${product.price} | ${categories}`;
    })
    .join("\n");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Title": "Technest Ecommerce",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openrouter/free",
      max_tokens: 320,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are Technest's shopping assistant. Answer only from the provided catalog. Help users find listed products and recommend compatible catalog products when a current product is provided. Do not invent products. If asked about stock availability, say live stock tracking is not enabled.",
        },
        {
          role: "user",
          content: `Catalog:\n${catalog}\n\nCurrent product: ${currentProduct ? currentProduct.name : "none"}\n\nCustomer question: ${message}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || null;
}

export default async function handler(req, res) {
  try {
    const allowed = applyRateLimit(req, res, {
      keyPrefix: "chat",
      windowMs: 60 * 1000,
      maxRequests: 30,
    });
    if (!allowed) return;

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const message = String(req.body?.message || "").trim();
    const currentProductId = String(req.body?.currentProductId || "");
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    await initMongoose();
    const products = (await Product.find().limit(80).lean()).map(compactProduct);

    let answer = null;
    try {
      answer = await callOpenRouter({ message, products, currentProductId });
    } catch (error) {
      console.error("OpenRouter chat error:", error);
    }

    if (!answer) {
      answer = findLocalMatches(message, products, currentProductId);
    }

    res.json({ answer });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
