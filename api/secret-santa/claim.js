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
            price: PRICE
          }
        ],
        currencyCode: "INR",
        note: "Secret Santa 2025 – Threads n Molds"
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

    // 🚨 Shopify-level errors
    if (data.errors) {
      console.error("Shopify GraphQL Errors:", data.errors);
      return res.status(500).json({
        success: false,
        error: data.errors
      });
    }

    const result = data?.data?.draftOrderCreate;

    // 🚨 Draft order user errors
    if (!result || result.userErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: result?.userErrors || "Draft order creation failed"
      });
    }

    return res.status(200).json({
      success: true,
      checkout_url: result.draftOrder.invoiceUrl,
      price: PRICE
    });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
