# M-Pesa STK Integration - Testing Guide

## Quick Start

### 1. Environment Setup
Add to your `.env` file:
```env
# M-Pesa Daraja API (Get from https://developer.safaricom.co.ke/)
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/finance/mpesa/callback
NODE_ENV=sandbox  # Use sandbox for testing
```

### 2. Start the App
```bash
npm run start:dev
# Client: http://localhost:5176
# Server: http://localhost:5000
```

### 3. Test M-Pesa Payment

#### Step 1: Navigate to Finance Page
- Login as **Reception** or **Admin** user
- Click **Finance** in sidebar
- Click **Record Payment** button

#### Step 2: Fill Payment Form
```
Invoice Number:    INV-TEST-001
Amount:            500 (KES)
Payment Method:    M-Pesa 📱
M-Pesa Phone:      254712345678 (or 07XXXXXXXX)
Patient:           Search and select a patient
Prescription:      (optional)
Notes:             (optional)
```

#### Step 3: Send M-Pesa Prompt
- Click **Send M-Pesa Prompt** button
- Watch the status indicator:
  - 🔄 "Initiating STK..."
  - ⏱️ "Waiting for PIN entry..."
  - ✅ "Payment successful!" (after PIN entered)
  - ❌ "Payment failed" (if user cancels or invalid PIN)

#### Step 4: Complete on Phone
- M-Pesa STK prompt appears on the provided phone
- Enter PIN code
- Payment processes automatically
- Check Finance page shows **"Paid"** status

### API Testing with cURL

#### Test STK Push Endpoint
```bash
curl -X POST http://localhost:5000/api/finance/mpesa/stk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "phoneNumber": "254712345678",
    "amount": 500,
    "invoiceNumber": "INV-TEST-001"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "STK push initiated successfully",
  "data": {
    "checkoutRequestID": "ws_co_123456789",
    "responseCode": "0",
    "responseDescription": "Success. Request accepted for processing",
    "customerMessage": "Please enter your M-Pesa PIN to complete this transaction."
  }
}
```

#### Test Status Query Endpoint
```bash
curl -X POST http://localhost:5000/api/finance/mpesa/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "checkoutRequestID": "ws_co_123456789"
  }'
```

### Test Scenarios

| Scenario | Input | Expected Result |
|----------|-------|-----------------|
| **Valid Payment** | Valid amount, phone, invoice | ✅ STK sent, payment marked PAID |
| **Invalid Phone** | 123456 | ❌ Error: Invalid phone format |
| **Zero Amount** | 0 | ❌ Error: Invalid amount |
| **Missing Phone** | "" | ❌ Error: Phone required for M-Pesa |
| **Timeout** | No user action for 60s | ⏱️ Option to save as pending |
| **User Cancels** | User declines STK | ❌ Payment failed, offer pending save |
| **Non-M-Pesa** | Cash, Card, etc. | ✅ Saved directly (no prompt) |

### Debug Tips

#### 1. Check Server Logs
```bash
# Watch server logs for M-Pesa activity
npm run start:server

# Look for:
# 📱 Initiating M-Pesa STK for...
# ✅ M-Pesa STK Response: {...}
# ❌ M-Pesa STK Error: {...}
```

#### 2. Verify Credentials
```bash
# Test token generation
curl -X GET https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials \
  -H "Authorization: Basic $(echo -n 'KEY:SECRET' | base64)"
```

#### 3. Check Database
```javascript
// MongoDB: Verify payment was created
db.payments.findOne({ invoiceNumber: "INV-TEST-001" });

// Should show:
// {
//   _id: ObjectId(...),
//   amount: 500,
//   paymentMethod: "mpesa",
//   mpesaPhone: "254712345678",
//   status: "paid" (if success) or "pending" (if timeout),
//   mpesaRef: "...",
//   createdAt: ...
// }
```

### Common Issues & Solutions

#### Issue: "Failed to get M-Pesa token"
```
❌ MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET invalid
✅ Solution: 
  1. Go to https://developer.safaricom.co.ke/
  2. Regenerate credentials
  3. Update .env file
  4. Restart server
```

#### Issue: "STK not appearing on phone"
```
❌ Phone number format incorrect
✅ Solution: Use format 254XXXXXXXXX (not +254, not 07)
   Example: 254712345678 ✅
           +254712345678 ❌
           07XXXXXXXX    ❌
```

#### Issue: "Status query returns pending after 60 seconds"
```
❌ User didn't enter PIN or network issue
✅ Solution: 
  - Check M-Pesa app on phone
  - Try again with new invoice number
  - Check internet connectivity
```

#### Issue: "CORS or Auth Error"
```
❌ Token not sent or invalid
✅ Solution:
  1. Login properly as reception/admin
  2. Check browser console for token
  3. Verify auth middleware in server logs
```

### Performance Metrics

**Expected Response Times:**
- STK Push Initiation: 2-3 seconds
- Payment Processing: 5-30 seconds (user-dependent)
- Status Query: 1-2 seconds
- Total Flow: 30-120 seconds

### Security Checklist

- [ ] M-Pesa credentials in `.env`, not in Git
- [ ] HTTPS enabled in production
- [ ] Callback URL whitelisted in Daraja
- [ ] Phone numbers validated before STK
- [ ] Amount validation against database
- [ ] User auth required for all endpoints
- [ ] Rate limiting enabled
- [ ] Error messages don't expose sensitive data
- [ ] Audit logs created for all transactions

### Production Deployment

1. **Set Real Credentials**
   - Update `.env` with production keys from Daraja
   - Set `NODE_ENV=production`

2. **Configure Callback**
   - Update `MPESA_CALLBACK_URL` to your domain
   - Ensure endpoint is accessible from internet
   - Implement callback handler (future task)

3. **Monitor Transactions**
   - Check Finance dashboard
   - Review payment logs
   - Monitor error rates

4. **User Communication**
   - Add help text on Finance page
   - Create FAQ for users
   - Phone support documentation

---

## Files Modified/Created

✅ **Created:**
- `server/utils/mpesa.js` - M-Pesa Daraja integration
- `MPESA_SETUP.md` - Setup documentation

✅ **Modified:**
- `server/controllers/financeController.js` - Added STK endpoints
- `server/routes/financeRoutes.js` - Added STK routes
- `client/src/services/financeService.js` - Added STK service functions
- `src/pages/Finance.jsx` - Integrated M-Pesa STK UI

## Next Steps

1. Add webhook handler for async M-Pesa callbacks
2. Implement payment reconciliation
3. Add SMS notifications to users
4. Create admin reports for M-Pesa transactions
5. Implement retry logic for failed payments
6. Add daily settlement reports

---
**Last Updated:** 2026-04-04
**Status:** ✅ Ready for Testing
