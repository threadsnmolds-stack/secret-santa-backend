export default function handler(req, res) {
  // ---- CORS HEADERS (VERY IMPORTANT) ----
  res.setHeader("Access-Control-Allow-Origin", "https://www.threadsnmolds.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ---- READ VARIANT ID FROM QUERY ----
  const { variant } = req.query;

  if (!variant) {
    return res.status(400).json({
      success: false,
      error: "Variant ID missing"
    });
  }

  // ---- BUILD SHOPIFY CART LINK ----
  const checkoutUrl = `https://www.threadsnmolds.com/cart/${variant}:1`;

  // ---- RETURN SUCCESS ----
  return res.status(200).json({
    success: true,
    checkout_url: checkoutUrl,
    price: 1
  });
}
