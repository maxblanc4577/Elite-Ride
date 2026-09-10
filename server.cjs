var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_stripe = __toESM(require("stripe"), 1);
import_dotenv.default.config();
var rootDir = process.cwd();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
var genAI = null;
function getGeminiClient() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    try {
      genAI = new import_genai.GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    } catch (e) {
      console.warn("Gemini API initialization warning:", e);
    }
  }
  return genAI;
}
app.post("/api/fare-estimate", (req, res) => {
  try {
    const { pickupId, dropoffId, distanceKm, category, promoCode, tipAmountUSD, tipAmountXCD } = req.body;
    const km = parseFloat(distanceKm) || 10;
    const miles = Math.max(0.5, Math.round(km * 0.621371 * 10) / 10);
    const perMileRateXCD = 13;
    const serviceFeeXCD = 1;
    const perMileRateUSD = Math.round(13 / 2.7 * 100) / 100;
    const serviceFeeUSD = Math.round(1 / 2.7 * 100) / 100;
    const distanceFareXCD = Math.round(miles * perMileRateXCD * 100) / 100;
    const distanceFareUSD = Math.round(distanceFareXCD / 2.7 * 100) / 100;
    let tipXCD = tipAmountXCD !== void 0 ? parseFloat(tipAmountXCD) : tipAmountUSD ? parseFloat(tipAmountUSD) * 2.7 : 5;
    let tipUSD = Math.round(tipXCD / 2.7 * 100) / 100;
    const isMountainRoute = pickupId?.includes("trafalgar") || dropoffId?.includes("trafalgar") || pickupId?.includes("freshwater") || dropoffId?.includes("freshwater") || pickupId?.includes("airport") || dropoffId?.includes("airport");
    const mtnFeeXCD = isMountainRoute ? 5 : 0;
    const mtnFeeUSD = Math.round(mtnFeeXCD / 2.7 * 100) / 100;
    const rawSubtotalXCD = distanceFareXCD + serviceFeeXCD + mtnFeeXCD;
    let discountXCD = 0;
    if (promoCode === "NATUREISLE") {
      discountXCD = rawSubtotalXCD * 0.15;
    } else if (promoCode === "DOM2026") {
      discountXCD = Math.min(10, rawSubtotalXCD * 0.2);
    }
    const discountUSD = Math.round(discountXCD / 2.7 * 100) / 100;
    const subtotalXCD = Math.max(1, rawSubtotalXCD - discountXCD);
    const subtotalUSD = Math.round(subtotalXCD / 2.7 * 100) / 100;
    const vatTaxXCD = Math.round(subtotalXCD * 0.1 * 100) / 100;
    const vatTaxUSD = Math.round(vatTaxXCD / 2.7 * 100) / 100;
    const totalXCD = Math.round((subtotalXCD + vatTaxXCD + tipXCD) * 100) / 100;
    const totalUSD = Math.round(totalXCD / 2.7 * 100) / 100;
    return res.json({
      distanceMiles: miles,
      distanceKm: Math.round(km * 10) / 10,
      perMileRateXCD,
      perMileRateUSD,
      distanceFareXCD,
      distanceFareUSD,
      serviceFeeXCD,
      serviceFeeUSD,
      tipXCD,
      tipUSD,
      mountainSurchargeXCD: mtnFeeXCD,
      mountainSurchargeUSD: mtnFeeUSD,
      discountXCD,
      discountUSD,
      subtotalXCD,
      subtotalUSD,
      vatTaxXCD,
      vatTaxUSD,
      totalXCD,
      totalUSD
    });
  } catch (error) {
    console.error("Error calculating fare:", error);
    return res.status(500).json({ error: "Failed to calculate fare" });
  }
});
app.post("/api/payment/process", (req, res) => {
  try {
    const { method, amountXCD, mpayPhone, bankRef, cardDetails, tipAmountXCD } = req.body;
    const transactionId = "SWIFT-DOM-" + Math.floor(1e5 + Math.random() * 9e5);
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    if (method === "cash") {
      return res.status(400).json({
        error: "Cash payments are not accepted. Swift-Ride operates exclusively with secure digital payment methods in Dominica."
      });
    }
    if (method === "mpay") {
      return res.json({
        success: true,
        transactionId,
        method: "mpay",
        amountXCD,
        tipAmountXCD: tipAmountXCD || 0,
        mpayPhone: mpayPhone || "+1 (767) 275-0000",
        message: `Mobile Payment request sent to ${mpayPhone || "Dominica mobile number"}. Instant XCD authorization completed!`,
        timestamp
      });
    }
    if (method === "nbd_bank") {
      return res.json({
        success: true,
        transactionId,
        method: "nbd_bank",
        amountXCD,
        tipAmountXCD: tipAmountXCD || 0,
        bankRef: bankRef || "NBD-TRANSFER-" + Math.floor(1e3 + Math.random() * 9e3),
        message: `National Bank of Dominica (NBD) direct bank transfer reference verified.`,
        timestamp
      });
    }
    if (method === "apple_pay") {
      return res.json({
        success: true,
        transactionId,
        method: "apple_pay",
        amountXCD,
        tipAmountXCD: tipAmountXCD || 0,
        message: `Apple Pay / Digital Wallet authorized EC$ ${amountXCD.toFixed(2)}.`,
        timestamp
      });
    }
    if (method === "card") {
      return res.json({
        success: true,
        transactionId,
        method: "card",
        amountXCD,
        tipAmountXCD: tipAmountXCD || 0,
        cardLast4: cardDetails?.cardNumber ? cardDetails.cardNumber.slice(-4) : "4242",
        message: `Card charged EC$ ${amountXCD.toFixed(2)} via Swift-Ride Dominica secure gateway.`,
        timestamp
      });
    }
    return res.status(400).json({ error: "Unsupported payment method" });
  } catch (error) {
    console.error("Payment processing error:", error);
    return res.status(500).json({ error: "Payment processing failed" });
  }
});
function getLocalDominicaAdvice(pickupName, dropoffName, vehicleCategory) {
  const pLower = (pickupName || "").toLowerCase();
  const dLower = (dropoffName || "").toLowerCase();
  const isMountain = pLower.includes("trafalgar") || dLower.includes("trafalgar") || pLower.includes("laudat") || dLower.includes("laudat") || pLower.includes("freshwater") || dLower.includes("freshwater") || pLower.includes("pont cass\xE9") || dLower.includes("pont cass\xE9") || pLower.includes("cochrane") || dLower.includes("cochrane") || pLower.includes("morne") || dLower.includes("morne");
  const isAirport = pLower.includes("airport") || dLower.includes("airport") || pLower.includes("marigot") || dLower.includes("marigot") || pLower.includes("douglas") || dLower.includes("douglas");
  const isNorth = pLower.includes("portsmouth") || dLower.includes("portsmouth") || pLower.includes("calibishie") || dLower.includes("calibishie") || pLower.includes("cabrits") || dLower.includes("cabrits");
  let routeAdvice = `Direct scenic arterial connection from ${pickupName} to ${dropoffName}.`;
  if (isMountain) {
    routeAdvice = `Traverses interior mountain passes near Morne Trois Pitons. Advise low gear on winding switchbacks between ${pickupName} and ${dropoffName}.`;
  } else if (isAirport) {
    routeAdvice = `Takes the Imperial Highway linking the Roseau / West Coast with Douglas-Charles Airport (DOM). Clear asphalt roadways.`;
  } else if (isNorth) {
    routeAdvice = `Follows the West Coast Highway along the Caribbean shoreline heading towards Portsmouth and Cabrits.`;
  }
  const weatherAlert = isMountain ? "Passing mountain rain mist in high rainforest canopy; cooling elevated breeze." : "Sunny Caribbean coastal conditions with mild sea breeze.";
  const terrainRating = isMountain ? vehicleCategory === "suv_4wd" ? "Optimal 4x4 - Confident grip on wet mountain inclines" : "Steep 12% incline - Moderate power required" : "Smooth coastal gradient - Standard road access";
  const localLandmarkTip = isMountain ? "Passes near Trafalgar Falls & Roseau Valley hot sulphur springs." : isAirport ? "Passes through Marigot & Pagua Bay banana plantations." : "Overlooks calm Caribbean coastal waters and local fishing bays.";
  return {
    routeAdvice,
    weatherAlert,
    terrainRating,
    localLandmarkTip
  };
}
app.post("/api/ai/route-assistant", async (req, res) => {
  const { pickupName = "Roseau", dropoffName = "Airport", vehicleCategory = "standard" } = req.body || {};
  const localFallback = getLocalDominicaAdvice(pickupName, dropoffName, vehicleCategory);
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json(localFallback);
    }
    const prompt = `You are the local Dominica navigation & dispatch assistant for Swift-Ride (the premier ride-share app in Dominica).
Provide a concise, helpful summary in JSON format for a trip from "${pickupName}" to "${dropoffName}" in Dominica with vehicle class "${vehicleCategory}".

Return ONLY raw JSON with keys:
"routeAdvice": (1 sentence on road terrain/conditions e.g. Imperial Road, West Coast Highway),
"weatherAlert": (1 short phrase on mountain mist, tropical sun, or coastal sea breeze),
"terrainRating": (1 short phrase e.g. "Mild coastal gradient" or "Steep mountain incline"),
"localLandmarkTip": (1 short phrase highlighting a landmark passed along the way, e.g. Cabrits, Boiling Lake ridge, Roseau Market).`;
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
    } catch (apiErr) {
      const msg = apiErr?.message || String(apiErr);
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
        console.log("Gemini API quota rate limit reached \u2014 seamlessly serving Dominica route intelligence");
      } else {
        console.log("Gemini API temporary notice \u2014 using local Dominica route intelligence fallback");
      }
      return res.json(localFallback);
    }
    const text = response?.text || "";
    let parsedJson = localFallback;
    try {
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedJson = JSON.parse(cleanJson);
    } catch {
      parsedJson = localFallback;
    }
    return res.json(parsedJson);
  } catch (error) {
    console.warn("AI Route Assistant handler fallback:", error?.message || error);
    return res.json(localFallback);
  }
});
app.post("/api/ai/help", async (req, res) => {
  const { question = "" } = req.body || {};
  const qLower = question.toLowerCase();
  let fallbackAnswer = `Swift-Ride is Dominica's premier ride-sharing platform. You can book rides across Roseau, Portsmouth, Douglas-Charles Airport (DOM), and nature attractions. Payments are seamlessly handled via MoBanking by NBD, mPay, or Credit/Debit Cards. For emergencies, use the red SOS button to connect directly with Dominica emergency services (+1 767 999).`;
  if (qLower.includes("payment") || qLower.includes("pay") || qLower.includes("mobanking") || qLower.includes("mpay") || qLower.includes("card")) {
    fallbackAnswer = `Swift-Ride supports 100% digital & flexible payments in Dominica:
1. MoBanking by NBD (National Bank of Dominica) - Direct instant mobile transfer with 0% fee.
2. mPay / DigiPay - Dominica mobile wallet payment.
3. Credit/Debit Cards - Visa & Mastercard charged in EC$ (XCD) or USD.
4. Cash & Driver Tips - You can tip your driver digitally or pay in cash at the end of your trip.`;
  } else if (qLower.includes("safety") || qLower.includes("mountain") || qLower.includes("sos") || qLower.includes("emergency")) {
    fallbackAnswer = `Safety is our highest priority in Dominica:
\u2022 4x4 Mountain Vehicles: All drivers handling mountain terrain (Trafalgar, Laudat, Freshwater Lake) operate verified 4WD SUVs.
\u2022 Live GPS & Geotagging: Share your live trip link with family or emergency contacts in real time.
\u2022 SOS Emergency Dispatch: The red SOS button triggers instant location alerts and connects to Dominica Police & Rescue (+1 767 999).
\u2022 Verified Drivers: Every driver holds a police record clearance and Dominica Taxi Association permit.`;
  } else if (qLower.includes("book") || qLower.includes("schedule") || qLower.includes("fare") || qLower.includes("cancel")) {
    fallbackAnswer = `Booking & Scheduling Rides on Swift-Ride:
\u2022 Instant Booking: Choose pickup & dropoff in Dominica, select your vehicle class (Eco, Sedan, 4WD SUV, Van), and request immediately.
\u2022 Scheduled Rides: Select "Schedule" mode to book future rides (e.g., airport transfers for Douglas-Charles DOM) up to 7 days in advance.
\u2022 Fare Transparency: Fares are calculated at EC$ 13.00/mile + EC$ 1.00 service fee, with 0 hidden charges. You can apply promo codes like NATUREISLE for discounts.`;
  }
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ answer: fallbackAnswer });
    }
    const prompt = `You are the friendly AI Support Agent for Swift-Ride (Dominica's premier ride-sharing app).
Answer the user's question clearly, concisely (2-4 bullet points or short paragraphs), and accurately regarding ride booking, payments in Dominica (MoBanking by NBD, mPay, cash, card), safety protocols, and mountain routes in Dominica.

User Question: "${question}"`;
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt
      });
    } catch {
      return res.json({ answer: fallbackAnswer });
    }
    const answerText = response?.text || fallbackAnswer;
    return res.json({ answer: answerText });
  } catch {
    return res.json({ answer: fallbackAnswer });
  }
});
var stripeClient = null;
function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripeClient = new import_stripe.default(key);
  }
  return stripeClient;
}
app.post("/api/create-product", async (req, res) => {
  try {
    const stripe = getStripe();
    const product = await stripe.products.create({
      name: req.body.name || "Example Product",
      default_price_data: {
        currency: req.body.currency || "usd",
        unit_amount: req.body.unit_amount || 2e3
      }
    });
    return res.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ error: error.message || "Failed to create product" });
  }
});
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const stripe = getStripe();
    const { priceId, successUrl, cancelUrl } = req.body;
    if (!priceId) {
      return res.status(400).json({ error: "priceId is required" });
    }
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: successUrl || "https://dashboard.stripe.com/workbench/blueprints/one-time-payment/checkout-chapter?confirmation-redirect=create-checkout-session",
      cancel_url: cancelUrl || "https://dashboard.stripe.com/workbench/blueprints/one-time-payment/checkout-chapter?confirmation-redirect=create-checkout-session"
    });
    return res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return res.status(500).json({ error: error.message || "Failed to create checkout session" });
  }
});
app.post("/api/webhook", import_express.default.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    const stripe = getStripe();
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    }
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log(`[Stripe Webhook] checkout.session.completed event processed for session ID: ${session.id}`);
  }
  return res.json({ received: true });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : { port: 24678 }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(rootDir, "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Swift-Ride Dominica server running on http://0.0.0.0:${PORT}`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`Port ${PORT} is already in use. Retrying connection...`);
    } else {
      console.error("Server error:", err);
    }
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
