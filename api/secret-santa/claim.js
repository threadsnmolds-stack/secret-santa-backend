export default async function handler(req, res) {
  // ✅ CORS HEADERS (THIS FIXES EVERYTHING)
  res.setHeader("Access-Control-Allow-Origin", "https://www.threadsnmolds.com");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 🔥 TEMP TEST RESPONSE (NO SHOPIFY YET)
    return res.status(200).json({
      success: true,
      checkout_url:
        "https://www.threadsnmolds.com/cart/61383901255:1",
      price: 1
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Santa got stuck in traffic 🎄"
    });
  }
}
