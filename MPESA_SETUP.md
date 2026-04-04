# M-Pesa STK Integration - Setup Guide

## Overview
This document explains how to set up and use the M-Pesa STK (SIM Toolkit) payment integration in MedVault.

## Environment Variables Required

Add the following to your `.env` file:

```env
# M-Pesa Daraja API Credentials
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_SHORTCODE=174379  # Or your actual shortcode
MPESA_PASSKEY=your_passkey_here
MPESA_CALLBACK_URL=https://yourdomain.com/api/finance/mpesa/callback

# Environment
NODE_ENV=production  # or sandbox for testing
```

## Getting M-Pesa Credentials

1. **Register on Daraja Portal**: https://developer.safaricom.co.ke/
2. **Create App**: Navigate to "Apps" and create a new application
3. **Copy Credentials**: 
   - Consumer Key
   - Consumer Secret
   - Shortcode (for Lipa na M-Pesa Online)
   - Passkey (different from app password)

## How M-Pesa STK Works

### On the Finance Page:

1. **Select M-Pesa Payment Method**
   - Form shows M-Pesa phone field
   - Enter patient details and amount

2. **Send M-Pesa Prompt**
   - Click "Send M-Pesa Prompt"
   - System initiates STK push via Daraja API
   - User receives M-Pesa prompt on their phone

3. **Enter PIN**
   - User enters their M-Pesa PIN
   - Payment is processed by Safaricom

4. **Confirmation**
   - System polls M-Pesa status
   - Payment marked as "paid" automatically
   - Confirmation shown on screen

## API Endpoints

### Initiate STK Push
```
POST /api/finance/mpesa/stk
Body: {
  phoneNumber: "254712345678",
  amount: 500,
  invoiceNumber: "INV-001"
}
```

### Query STK Status
```
POST /api/finance/mpesa/query
Body: {
  checkoutRequestID: "ws_co_123456789"
}
```

## Frontend Usage

```javascript
import { initiateMpesaSTK, queryMpesaSTKStatus } from "../services/financeService.js";

// Trigger STK
const response = await initiateMpesaSTK(phoneNumber, amount, invoiceNumber);
// response.data.checkoutRequestID = use this to query status

// Check status
const status = await queryMpesaSTKStatus(checkoutRequestID);
// status.data.isSuccess = true/false
```

## Testing in Sandbox

### Test Credentials
- Phone: 254708374149
- Amount: Any (1-60000)

### Expected Flow
1. System sends STK to test phone
2. M-Pesa app shows prompt (in sandbox)
3. Enter test PIN: 1234
4. System confirms payment

## Error Handling

### Common Issues:
- **Invalid Phone**: Format must be 254XXXXXXXXX
- **Timeout**: If no response in 60s, user can save as pending
- **Network Error**: Gracefully saves as pending and shows error

### Troubleshooting:
1. Check environment variables are set
2. Verify API credentials are correct
3. Ensure phone number format is correct
4. Check internet connectivity
5. Review server logs for Daraja API errors

## Status Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Insufficient Funds |
| 2 | Less than minimum transaction value |
| 3 | More than maximum transaction value |
| 4 | Transaction timeout |
| 5 | Transaction cancelled by user |
| 6 | Transaction ID is invalid |
| 17 | Invalid account number |

## Production Checklist

- [ ] M-Pesa credentials added to production .env
- [ ] Callback URL configured in Daraja portal
- [ ] HTTPS enabled on callback endpoint
- [ ] Error logging configured
- [ ] User instructions added to Finance page UI
- [ ] Testing completed with real M-Pesa account
- [ ] Webhook handler implemented for async callbacks
- [ ] Fallback handling for timeout cases

## Security Notes

- **Never commit .env** with real credentials
- **Use strong passkeys** from M-Pesa dashboard
- **Validate phone numbers** before STK push
- **Verify amounts** match database records
- **Log all transactions** for audit trail
- **Implement rate limiting** to prevent abuse

## Support

For issues:
1. Check M-Pesa Daraja documentation
2. Review server logs
3. Test credentials manually with cURL
4. Verify database Payment records

---
Last Updated: 2026-04-04
