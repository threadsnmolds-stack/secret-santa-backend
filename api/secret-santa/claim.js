export default async function handler(req, res) {

  // ✅ CORS HEADERS (REQUIRED FOR SHOPIFY)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
    const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
    const PRICE = process.env.SECRET_SANTA_PRICE || "1";

    if (!SHOP || !TOKEN) {
      throw new Error("Missing Shopify environment variables");
    }

    // Shopify GraphQL
    const response = await fetch(`https://${SHOP}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({
        query: `
          mutation DraftOrderCreate($input: DraftOrderInput!) {
            draftOrderCreate(input: $input) {
              draftOrder {
                invoiceUrl
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          input: {
            lineItems: [
              {
                title: "🎅 Secret Santa Gift",
                quantity: 1,
                originalUnitPrice: PRICE
              }
            ],
            note: "Secret Santa 2025 - Threads n Molds",
            tags: ["SECRET_SANTA_2025"]
          }
        }
      })
    });

    const json = await response.json();

    const invoiceUrl = json?.data?.draftOrderCreate?.draftOrder?.invoiceUrl;

    if (!invoiceUrl) {
      return res.status(500).json({
        success: false,
        error: json?.data?.draftOrderCreate?.userErrors || "Draft order failed"
      });
    }

    return res.status(200).json({
      success: true,
      checkout_url: invoiceUrl,
      price: PRICE
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
