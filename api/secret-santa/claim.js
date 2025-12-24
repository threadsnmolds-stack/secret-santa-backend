export default async function handler(req, res) {
  // Allow CORS (important for Shopify)
  res.setHeader("Access-Control-Allow-Origin", "https://www.threadsnmolds.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
    const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

    if (!SHOP || !TOKEN) {
      throw new Error("Missing Shopify ENV variables");
    }

    const variantId = req.query.variant;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        error: "Variant ID missing",
      });
    }

    const mutation = `
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
    `;

    const variables = {
      input: {
        lineItems: [
          {
            variantId: `gid://shopify/ProductVariant/${variantId}`,
            quantity: 1,
          },
        ],
        note: "🎅 Secret Santa ₹1 – Threads n Molds",
        useCustomerDefaultAddress: true,
        tags: ["secret-santa"],
      },
    };

    const response = await fetch(
      `https://${SHOP}/admin/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": TOKEN,
        },
        body: JSON.stringify({ query: mutation, variables }),
      }
    );

    const result = await response.json();

    const draft =
      result?.data?.draftOrderCreate?.draftOrder?.invoiceUrl;

    if (!draft) {
      console.error(result);
      throw new Error("Draft order failed");
    }

    return res.status(200).json({
      success: true,
      checkout_url: draft,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
