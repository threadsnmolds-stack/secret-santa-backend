export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false });
  }

  try {
    const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
    const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
    const PRICE = process.env.SECRET_SANTA_PRICE || "1";

    if (!SHOP || !TOKEN) {
      throw new Error("Missing env variables");
    }

    const mutation = `
      mutation {
        draftOrderCreate(
          input: {
            note: "Secret Santa 2025 - Threads n Molds"
            lineItems: [
              {
                title: "🎁 Secret Santa Gift"
                quantity: 1
                originalUnitPrice: "${PRICE}"
              }
            ]
          }
        ) {
          draftOrder {
            invoiceUrl
          }
          userErrors {
            message
          }
        }
      }
    `;

    const response = await fetch(
      `https://${SHOP}/admin/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": TOKEN,
        },
        body: JSON.stringify({ query: mutation }),
      }
    );

    const json = await response.json();

    const invoiceUrl =
      json?.data?.draftOrderCreate?.draftOrder?.invoiceUrl;

    if (!invoiceUrl) {
      throw new Error("Draft order failed");
    }

    return res.status(200).json({
      success: true,
      checkout_url: invoiceUrl,
      price: PRICE,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
