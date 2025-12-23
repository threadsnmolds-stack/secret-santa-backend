export default async function handler(req, res) {
  try {
    // Only allow GET
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ENV CHECK
    const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
    const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
    const PRICE = process.env.SECRET_SANTA_PRICE || "1";

    if (!SHOP || !TOKEN) {
      throw new Error("Missing Shopify environment variables");
    }

    // Draft Order GraphQL mutation
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

    const body = {
      query: mutation,
     variables: {
  input: {
    lineItems: [
      {
        title: "🎅 Secret Santa Gift",
        price: PRICE,
        quantity: 1
      }
    ],
    currencyCode: "INR",
    note: "Secret Santa 2025 – Threads n Molds"
  }
}

    };

    const response = await fetch(
      `https://${SHOP}/admin/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": TOKEN
        },
        body: JSON.stringify(body)
      }
    );

    const json = await response.json();

    // Shopify error handling
    const errors = json?.data?.draftOrderCreate?.userErrors;
    if (errors && errors.length > 0) {
      throw new Error(errors[0].message);
    }

    const invoiceUrl =
      json.data.draftOrderCreate.draftOrder.invoiceUrl;

    return res.status(200).json({
      success: true,
      checkout_url: invoiceUrl,
      price: PRICE
    });

  } catch (err) {
    console.error("SECRET SANTA ERROR:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
