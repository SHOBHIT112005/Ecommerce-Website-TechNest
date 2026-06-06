import Product from "@/models/Products";

const products = [
  { name: "MacBook Pro", description: "Powerful laptop for professionals with M3 chip and stunning Retina display.", price: 1299, categories: ["Laptops"], picture: "/products/macbook.png" },
  { name: "ASUS ROG", description: "High-performance gaming laptop with RTX graphics and 165Hz display.", price: 1499, categories: ["Laptops", "Gaming"], picture: "/products/rog.png" },
  { name: "MSI Gaming", description: "Premium gaming laptop with mechanical keyboard and RGB lighting.", price: 1399, categories: ["Laptops", "Gaming"], picture: "/products/msi.png" },
  { name: "Dell XPS 15", description: "Ultra-thin laptop with OLED touchscreen and Intel Core i9 processor.", price: 1099, categories: ["Laptops"], picture: "/products/xps15new.png" },
  { name: "Lenovo ThinkPad X1", description: "Business-class laptop with legendary keyboard and robust build.", price: 1249, categories: ["Laptops"], picture: "/products/x1.png" },
  { name: "HP Spectre x360", description: "Convertible 2-in-1 laptop with 4K display and gem-cut design.", price: 1149, categories: ["Laptops"], picture: "/products/x360new.png" },
  { name: "Razer Blade 15", description: "Sleek gaming laptop with RTX 4070 and 240Hz QHD display.", price: 1599, categories: ["Laptops", "Gaming"], picture: "/products/blade.png" },
  { name: "iPhone 15", description: "Latest Apple smartphone with A17 Pro chip and titanium design.", price: 999, categories: ["Phones"], picture: "/products/iphone.png" },
  { name: "Samsung Galaxy S24", description: "Flagship Android phone with AI features and stunning camera.", price: 899, categories: ["Phones"], picture: "/products/galaxy.png" },
  { name: "Xiaomi Redmi Note", description: "Feature-packed budget smartphone with great battery life.", price: 399, categories: ["Phones"], picture: "/products/redmi.png" },
  { name: "Google Pixel 9", description: "Pure Android experience with Tensor G4 chip and amazing camera.", price: 799, categories: ["Phones"], picture: "/products/pixelnew.png" },
  { name: "OnePlus 12", description: "Fast and smooth flagship with 100W charging and Hasselblad cameras.", price: 699, categories: ["Phones"], picture: "/products/12.png" },
  { name: "Nothing Phone (2)", description: "Unique transparent design with Glyph Interface and clean OS.", price: 599, categories: ["Phones"], picture: "/products/np2new.png" },
  { name: "Oppo Find X7", description: "Ultra flagship with periscope zoom and MediaTek Dimensity 9300.", price: 749, categories: ["Phones"], picture: "/products/x7.png" },
  { name: "AirPods Pro", description: "Wireless earbuds with active noise cancellation and spatial audio.", price: 249, categories: ["Accessories"], picture: "/products/airpods.png" },
  { name: "Huawei FreeBuds", description: "Premium wireless earbuds with long battery life and comfort fit.", price: 179, categories: ["Accessories"], picture: "/products/freebuds.png" },
  { name: "Gaming Headset", description: "7.1 surround sound headset with noise-cancelling microphone.", price: 129, categories: ["Accessories", "Gaming"], picture: "/products/headset.png" },
  { name: "Apple Watch Series 9", description: "Advanced health tracking with S9 chip and always-on Retina display.", price: 399, categories: ["Accessories"], picture: "/products/applenew.png" },
  { name: "Samsung Galaxy Watch", description: "Feature-rich smartwatch with Wear OS and BioActive sensor.", price: 329, categories: ["Accessories"], picture: "/products/watch.png" },
  { name: "Logitech MX Master 3S", description: "Premium ergonomic mouse with quiet clicks and MagSpeed scroll.", price: 99, categories: ["Accessories"], picture: "/products/mx.png" },
  { name: "Anker Power Bank", description: "20000mAh high-capacity fast-charging portable battery pack.", price: 79, categories: ["Accessories"], picture: "/products/powerbank.png" },
  { name: "Nintendo Switch OLED", description: "Hybrid console with vibrant 7-inch OLED screen and enhanced audio.", price: 349, categories: ["Gaming"], picture: "/products/switch.png" },
  { name: "PS5 DualSense", description: "Wireless controller with haptic feedback and adaptive triggers.", price: 74, categories: ["Gaming"], picture: "/products/ps5.png" },
  { name: "Xbox Series X", description: "Most powerful Xbox with 12 TFLOPS and 1TB SSD for quick loading.", price: 499, categories: ["Gaming"], picture: "/products/xbox.png" },
  { name: "Samsung Odyssey G7", description: "32-inch 4K 144Hz curved gaming monitor with 1ms response time.", price: 799, categories: ["Gaming"], picture: "/products/g7.png" },
];

export async function seedProducts() {
  const count = await Product.countDocuments();
  if (count > 0) return;
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products`);
}
