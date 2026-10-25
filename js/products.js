/* products.js - demo catalogue (42 products). Images are generated locally as SVG
   placeholders so no external image source or licence is needed. */
const DEFAULT_CATEGORIES = [
  { name: "Women's Fashion", icon: "👗", hue: 330 },
  { name: "Men's Fashion", icon: "👔", hue: 215 },
  { name: "Kids", icon: "🧸", hue: 45 },
  { name: "Home and Kitchen", icon: "🏠", hue: 25 },
  { name: "Beauty and Personal Care", icon: "💄", hue: 345 },
  { name: "Footwear", icon: "👟", hue: 160 },
  { name: "Accessories", icon: "👜", hue: 275 },
  { name: "Electronics and Lifestyle", icon: "🎧", hue: 195 }
];
const SZ_CLOTH = ["S", "M", "L", "XL"], SZ_FREE = ["Free Size"], SZ_KIDS = ["2-3Y", "4-5Y", "6-7Y"], SZ_SHOE = ["6", "7", "8", "9", "10"];
const COLORS = ["Pink", "Blue", "Black", "Green"];
// [name, category, price, original, rating, reviews, stock, sizes, colors, keywords, icon, isNew, isFeatured]
const RAW_PRODUCTS = [
  ["Floral Print Anarkali Kurti", "Women's Fashion", 449, 1199, 4.2, 3180, 40, SZ_CLOTH, COLORS, "kurti ethnic anarkali floral", "👗", 0, 1],
  ["Cotton Printed Saree with Blouse", "Women's Fashion", 599, 1799, 4.1, 5230, 25, SZ_FREE, COLORS, "saree sari ethnic cotton", "🥻", 0, 1],
  ["Rayon Straight Kurta Pant Set", "Women's Fashion", 699, 1599, 4.3, 2140, 30, SZ_CLOTH, COLORS, "kurta set pant suit", "👚", 1, 0],
  ["Women's High Waist Palazzo", "Women's Fashion", 249, 699, 4.0, 4120, 60, SZ_CLOTH, COLORS, "palazzo pants bottom wear", "👖", 0, 0],
  ["Embroidered Dupatta Chunni", "Women's Fashion", 199, 599, 4.0, 1260, 50, SZ_FREE, COLORS, "dupatta chunni stole ethnic", "🧣", 0, 0],
  ["Western A-Line Midi Dress", "Women's Fashion", 549, 1499, 4.2, 980, 20, SZ_CLOTH, COLORS, "dress western midi party", "👗", 1, 1],
  ["Men's Cotton Casual Shirt", "Men's Fashion", 399, 999, 4.1, 6120, 70, SZ_CLOTH, COLORS, "shirt casual cotton formal", "👔", 0, 1],
  ["Men's Round Neck T-Shirt Pack of 2", "Men's Fashion", 349, 899, 4.2, 8450, 90, SZ_CLOTH, COLORS, "tshirt tee combo pack", "👕", 0, 1],
  ["Slim Fit Stretch Jeans", "Men's Fashion", 699, 1999, 4.0, 3320, 35, ["28", "30", "32", "34"], ["Blue", "Black"], "jeans denim pant slim", "👖", 0, 0],
  ["Men's Ethnic Kurta with Pyjama", "Men's Fashion", 799, 2199, 4.3, 1870, 22, SZ_CLOTH, COLORS, "kurta pajama ethnic festive", "🥼", 1, 0],
  ["Men's Track Pants Pack of 2", "Men's Fashion", 429, 1099, 4.1, 2990, 55, SZ_CLOTH, ["Black", "Blue"], "track pant lower sports", "🩳", 0, 0],
  ["Men's Winter Hooded Sweatshirt", "Men's Fashion", 649, 1799, 4.2, 1540, 28, SZ_CLOTH, ["Black", "Green", "Blue"], "hoodie sweatshirt winter", "🧥", 1, 1],
  ["Kids Cotton Frock Party Wear", "Kids", 349, 899, 4.3, 1210, 32, SZ_KIDS, ["Pink", "Blue"], "girls frock dress kids party", "👧", 0, 1],
  ["Boys Cartoon Print T-Shirt Set", "Kids", 299, 799, 4.1, 2210, 45, SZ_KIDS, ["Blue", "Green"], "boys tshirt shorts set kids", "👦", 0, 0],
  ["Soft Plush Teddy Bear 60cm", "Kids", 499, 1299, 4.5, 3340, 18, SZ_FREE, ["Pink", "Brown"], "teddy soft toy gift", "🧸", 0, 1],
  ["Wooden Building Blocks 100 pcs", "Kids", 379, 999, 4.4, 1720, 26, SZ_FREE, [], "blocks toys educational puzzle", "🧩", 1, 0],
  ["Kids School Backpack 18L", "Kids", 449, 1199, 4.2, 2650, 38, SZ_FREE, ["Blue", "Pink", "Green"], "school bag backpack kids", "🎒", 0, 0],
  ["Baby Cotton Onesie Pack of 3", "Kids", 329, 799, 4.4, 980, 44, ["0-3M", "3-6M", "6-9M"], ["White", "Pink"], "baby onesie romper newborn", "👶", 1, 0],
  ["Non-Stick Cookware Set 3 pcs", "Home and Kitchen", 899, 2999, 4.2, 4410, 15, SZ_FREE, ["Black"], "cookware pan tawa kadhai kitchen", "🍳", 0, 1],
  ["Double Bedsheet with 2 Pillow Covers", "Home and Kitchen", 399, 1299, 4.1, 7230, 42, SZ_FREE, COLORS, "bedsheet bedding cotton home", "🛏️", 0, 1],
  ["Stainless Steel Water Bottle 1L", "Home and Kitchen", 249, 699, 4.3, 9120, 80, SZ_FREE, ["Silver", "Black", "Blue"], "bottle steel insulated water", "🧴", 0, 0],
  ["Kitchen Storage Containers Set of 12", "Home and Kitchen", 429, 1199, 4.2, 3880, 33, SZ_FREE, [], "container storage jar kitchen organiser", "🥫", 0, 0],
  ["LED String Fairy Lights 10m", "Home and Kitchen", 199, 599, 4.2, 6410, 100, SZ_FREE, ["Warm White", "Multi"], "lights decor diwali festive led", "💡", 1, 1],
  ["Microfibre Cleaning Cloth Pack of 10", "Home and Kitchen", 149, 499, 4.0, 2410, 120, SZ_FREE, [], "cleaning cloth duster kitchen", "🧽", 0, 0],
  ["Matte Liquid Lipstick Combo of 6", "Beauty and Personal Care", 299, 999, 4.1, 7810, 65, SZ_FREE, [], "lipstick makeup matte lips combo", "💄", 0, 1],
  ["Vitamin C Face Serum 30ml", "Beauty and Personal Care", 349, 899, 4.3, 5120, 48, SZ_FREE, [], "serum face skincare vitamin glow", "🧪", 1, 1],
  ["Herbal Hair Oil 200ml", "Beauty and Personal Care", 199, 449, 4.2, 6740, 75, SZ_FREE, [], "hair oil herbal growth ayurvedic", "🌿", 0, 0],
  ["Men's Grooming Beard Kit", "Beauty and Personal Care", 449, 1199, 4.1, 1330, 30, SZ_FREE, [], "beard oil grooming trimmer kit men", "🧔", 0, 0],
  ["Compact Face Powder SPF 20", "Beauty and Personal Care", 179, 399, 4.0, 2260, 52, SZ_FREE, ["Beige", "Natural"], "compact powder makeup sunscreen", "🪞", 0, 0],
  ["Women's Casual Sandals Flats", "Footwear", 299, 899, 4.0, 5470, 46, ["5", "6", "7", "8"], ["Black", "Pink"], "sandals flats chappal women", "🥿", 0, 1],
  ["Men's Running Sports Shoes", "Footwear", 799, 2499, 4.2, 6210, 34, SZ_SHOE, ["Black", "Blue"], "shoes running sports sneakers", "👟", 1, 1],
  ["Men's Flip Flops Slippers", "Footwear", 149, 399, 3.9, 8930, 110, SZ_SHOE, ["Black", "Blue"], "slippers flip flop chappal", "🩴", 0, 0],
  ["Kids LED Light-up Shoes", "Footwear", 449, 1199, 4.3, 1760, 24, ["1", "2", "3"], ["Pink", "Blue"], "kids shoes led light", "👞", 0, 0],
  ["Block Heel Party Sandals", "Footwear", 499, 1399, 4.1, 1190, 21, ["5", "6", "7", "8"], ["Gold", "Black"], "heels sandals party women", "👠", 1, 0],
  ["Women's Sling Handbag", "Accessories", 399, 1299, 4.2, 4320, 37, SZ_FREE, ["Black", "Pink", "Brown"], "handbag bag purse sling", "👜", 0, 1],
  ["Analog Wrist Watch for Men", "Accessories", 499, 1599, 4.0, 3560, 29, SZ_FREE, ["Black", "Silver"], "watch wrist analog men", "⌚", 0, 0],
  ["Oxidised Silver Jhumka Earrings", "Accessories", 149, 499, 4.2, 5780, 85, SZ_FREE, [], "jhumka earrings jewellery oxidised", "💎", 0, 1],
  ["UV Protection Sunglasses", "Accessories", 249, 799, 4.1, 2890, 60, SZ_FREE, ["Black", "Brown"], "sunglasses shades goggles", "🕶️", 1, 0],
  ["Men's Genuine Leather Wallet", "Accessories", 299, 899, 4.3, 4630, 56, SZ_FREE, ["Black", "Brown"], "wallet leather men purse", "👛", 0, 0],
  ["Bluetooth Wireless Earbuds", "Electronics and Lifestyle", 799, 2999, 4.1, 12430, 40, SZ_FREE, ["Black", "White"], "earbuds bluetooth wireless headphones tws", "🎧", 1, 1],
  ["20000mAh Power Bank", "Electronics and Lifestyle", 1099, 2499, 4.3, 5230, 27, SZ_FREE, ["Black"], "power bank charger battery", "🔋", 0, 1],
  ["Smart Fitness Band", "Electronics and Lifestyle", 999, 3499, 4.0, 3980, 31, SZ_FREE, ["Black", "Blue"], "smart band watch fitness tracker", "⌚", 1, 0],
  ["Rechargeable Mini Table Fan", "Electronics and Lifestyle", 449, 1299, 4.0, 2780, 36, SZ_FREE, ["White", "Pink"], "fan table portable usb cooler", "🌀", 0, 0],
  ["Phone Case with Ring Holder", "Electronics and Lifestyle", 149, 499, 4.1, 7640, 130, SZ_FREE, ["Black", "Blue", "Pink"], "phone case cover mobile", "📱", 0, 0],
  ["Fast Charging Cable 1.5m (Type-C)", "Electronics and Lifestyle", 129, 399, 4.2, 9820, 150, SZ_FREE, ["Black", "White"], "cable charger usb type c fast", "🔌", 0, 0]
];

function buildDefaultProducts() {
  const base = Date.parse("2026-10-01T00:00:00Z");
  return RAW_PRODUCTS.map((r, i) => {
    const [name, category, price, originalPrice, rating, reviews, stock, sizes, colors, keywords, icon, isNew, featured] = r;
    return {
      id: 101 + i, name, category, price, originalPrice,
      discount: Math.round((originalPrice - price) / originalPrice * 100),
      rating, reviews, stock, sizes, colors,
      description: name + " — a quality demo product in the " + category + " category. Comfortable, durable and made for everyday use.",
      image: "", icon, keywords: keywords.split(" "),
      isNew: !!isNew, featured: !!featured,
      createdAt: base + (isNew ? (i + 100) : i) * 86400000
    };
  });
}
