export default async function handler(req, res) {
 // ✅ CORS — allow Shopify store
res.setHeader("Access-Control-Allow-Origin", "https://www.threadsnmolds.com");
res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

// ✅ Preflight
if (req.method === "OPTIONS") {
  return res.status(200).end();
}


  try {
    if (req.method !== "GET") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
    const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
    const PRICE = process.env.SECRET_SANTA_PRICE || "1";

    if (!SHOP || !TOKEN) {
      throw new Error("Missing Shopify environment variables");
    }

    const mutation = `
      mutation DraftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            invoiceUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        lineItems: [
          {
            title: "🎅 Secret Santa Gift",
            quantity: 1,
            originalUnitPrice: PRICE
          }
        ],
        note: "Secret Santa 2025 - Threads n Molds"
      }
    };

    const response = await fetch(
      `https://${SHOP}/admin/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": TOKEN
        },
        body: JSON.stringify({ query: mutation, variables })
      }
    );

    const data = await response.json();

    if (data.errors || data.data.draftOrderCreate.userErrors.length) {
      return res.status(400).json({
        success: false,
        error: data.errors || data.data.draftOrderCreate.userErrors
      });
    }

    return res.status(200).json({
      success: true,
      checkout_url: data.data.draftOrderCreate.draftOrder.invoiceUrl,
      price: PRICE
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

