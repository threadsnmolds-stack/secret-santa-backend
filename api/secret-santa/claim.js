export default async function handler(req, res) {
  // Allow only GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
    const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
    const PRICE = process.env.SECRET_SANTA_PRICE || "1";

    if (!SHOP || !TOKEN) {
      return res.status(500).json({
        error: "Missing Shopify environment variables",
      });
    }

    // Draft Order payload
    const draftOrderPayload = {
      draft_order: {
        line_items: [
          {
            title: "🎅 Secret Santa Gift",
            quantity: 1,
            price: PRICE,
          },
        ],
        note: "Secret Santa one-time claim 🎄",
        tags: "secret-santa,christmas-2025",
        use_customer_default_address: false,
      },
    };

    // Create Draft Order
    const response = await fetch(
      `https://${SHOP}/admin/api/2024-01/draft_orders.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": TOKEN,
        },
        body: JSON.stringify(draftOrderPayload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Failed to create draft order",
        details: data,
      });
    }

    // Return invoice URL (secure checkout link)
    return res.status(200).json({
      success: true,
      checkout_url: data.draft_order.invoice_url,
      price: PRICE,
    });
  } catch (error) {
    return res.stat
