export default async function handler(req, res) {
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

    const mutation = `
      mutation CreateDraftOrder($input: DraftOrderInput!) {
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
        note: "Secret Santa 2025 – Threads n Molds",
        lineItems: [
          {
            title: "🎅 Secret Santa Gift",
            quantity: 1,
            originalUnitPrice: PRICE
          }
        ]
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
        body: JSON.stringify({
          query: mutation,
          variables
        })
      }
    );

    const json = await response.json();

    const errors = json?.data?.draftOrderCreate?.userErrors;
    if (errors && errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const invoiceUrl =
      json?.data?.draftOrderCreate?.draftOrder?.invoiceUrl;

    return res.status(200).json({
      success: true,
      checkout_url: invoiceUrl,
      price: PRICE
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
