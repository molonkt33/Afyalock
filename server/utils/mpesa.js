import axios from "axios";

// M-Pesa Daraja API Configuration
const MPESA_CONFIG = {
  CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
  CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
  SHORTCODE: process.env.MPESA_SHORTCODE || "174379",
  PASSKEY: process.env.MPESA_PASSKEY,
  CALLBACK_URL: process.env.MPESA_CALLBACK_URL || "https://medvault.vercel.app/api/finance/mpesa/callback",
  ENVIRONMENT: process.env.NODE_ENV === "production" ? "production" : "sandbox"
};

const BASE_URL = MPESA_CONFIG.ENVIRONMENT === "production" 
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

// Get M-Pesa access token
export const getMpesaToken = async () => {
  try {
    const credentials = Buffer.from(
      `${MPESA_CONFIG.CONSUMER_KEY}:${MPESA_CONFIG.CONSUMER_SECRET}`
    ).toString("base64");

    const response = await axios.get(
      `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("Error getting M-Pesa token:", error.response?.data || error.message);
    throw new Error("Failed to get M-Pesa token");
  }
};

// Generate password for M-Pesa STK
const generateMpesaPassword = (timestamp) => {
  const str = `${MPESA_CONFIG.SHORTCODE}${MPESA_CONFIG.PASSKEY}${timestamp}`;
  return Buffer.from(str).toString("base64");
};

// Initiate M-Pesa STK Push
export const initiateMpesaSTK = async (phoneNumber, amount, accountReference) => {
  try {
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").substring(0, 14);
    const password = generateMpesaPassword(timestamp);

    // Format phone number: remove + and add 254 if needed
    let formattedPhone = phoneNumber.replace(/^\+/, "");
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone.substring(formattedPhone.length - 9);
    }

    const payload = {
      BusinessShortCode: MPESA_CONFIG.SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: MPESA_CONFIG.SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CONFIG.CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: `MedVault Payment - ${accountReference}`,
    };

    console.log("📱 Initiating M-Pesa STK for:", {
      phone: formattedPhone,
      amount: amount,
      reference: accountReference,
    });

    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ M-Pesa STK Response:", response.data);

    return {
      success: true,
      checkoutRequestID: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
      customerMessage: response.data.CustomerMessage,
    };
  } catch (error) {
    console.error("❌ M-Pesa STK Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || "Failed to initiate M-Pesa STK");
  }
};

// Query M-Pesa STK Status
export const queryMpesaSTKStatus = async (checkoutRequestID) => {
  try {
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").substring(0, 14);
    const password = generateMpesaPassword(timestamp);

    const payload = {
      BusinessShortCode: MPESA_CONFIG.SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID,
    };

    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const metadataItems = response.data?.CallbackMetadata?.Item || response.data?.ResultParameters?.ResultParameter || [];
    const mpesaReceiptNumber = metadataItems.find((item) => item.Name === "MpesaReceiptNumber")?.Value || null;

    return {
      success: true,
      resultCode: response.data.ResultCode,
      resultDesc: response.data.ResultDesc,
      mpesaReceiptNumber,
    };
  } catch (error) {
    console.error("❌ M-Pesa Query Error:", error.response?.data || error.message);
    throw new Error("Failed to query M-Pesa status");
  }
};

export default {
  getMpesaToken,
  initiateMpesaSTK,
  queryMpesaSTKStatus,
  MPESA_CONFIG,
};
