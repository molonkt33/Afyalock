# M-Pesa STK - Quick Reference

## 🎯 Quick Start (60 seconds)

### Setup (.env)
```env
MPESA_CONSUMER_KEY=XXX
MPESA_CONSUMER_SECRET=XXX
MPESA_SHORTCODE=174379
MPESA_PASSKEY=XXX
NODE_ENV=sandbox
```

### Usage (Finance Page)
1. Click **Record Payment**
2. Select **M-Pesa** method
3. Enter phone: **254XXXXXXXXX**
4. Fill amount, invoice, patient
5. Click **Send M-Pesa Prompt**
6. ✅ Status appears instantly

---

## 📱 Phone Format

| Format | Example | Status |
|--------|---------|--------|
| 254... | 254712345678 | ✅ OK |
| 07... | 0712345678 | ✅ Auto-converted |
| +254... | +254712345678 | ✅ Auto-converted |
| Invalid | 123456 | ❌ Error |

---

## 🔄 Payment Statuses

| Status | Meaning | What to Do |
|--------|---------|-----------|
| 🔄 initiated | STK sent to phone | Wait for user PIN |
| ⏳ waiting | Waiting for response | User entering PIN |
| ✅ success | Payment complete | Nothing, auto-saved |
| ❌ failed | Payment failed/canceled | Retry or save pending |

---

## 🐛 Troubleshooting

### "STK not appearing"
- ❌ Wrong phone number format
- ✅ Use: 254XXXXXXXXX

### "Invalid credentials"
- ❌ .env not set properly
- ✅ Check Daraja dashboard

### "Timeout after 60s"
- ❌ User didn't enter PIN
- ✅ Can save as pending pending

---

## 🧩 API Endpoints

```
POST /api/finance/mpesa/stk
{
  "phoneNumber": "254712345678",
  "amount": 500,
  "invoiceNumber": "INV-001"
}

POST /api/finance/mpesa/query
{
  "checkoutRequestID": "ws_co_123456"
}
```

---

## 📊 Database Fields

```javascript
{
  paymentMethod: "mpesa",
  mpesaPhone: "254712345678",     // Phone used
  status: "paid" | "pending",      // Payment status
  paymentReference: "INV-...",     // Unique ID
  amount: 500,                     // Amount in KES
}
```

---

## 🎵 Error Codes

| Code | Error | Fix |
|------|-------|-----|
| 1 | Insufficient Funds | Add money to M-Pesa |
| 2 | Below Minimum | Min amount is 1 KES |
| 3 | Above Maximum | Max amount is 60,000 KES |
| 4 | Timeout | Retry transaction |
| 5 | Cancelled | User declined |
| 17 | Invalid Account | Check phone number |

---

## ✅ Ready Checklist

- [ ] .env has M-Pesa credentials
- [ ] Server running (port 5000)
- [ ] Client running (port 5176)
- [ ] Logged in as Reception/Admin
- [ ] Finance page accessible
- [ ] Can see M-Pesa option

---

## 📞 Files Reference

| File | Purpose |
|------|---------|
| MPESA_SETUP.md | Full setup guide |
| MPESA_TESTING.md | Test scenarios |
| MPESA_IMPLEMENTATION.md | Technical details |
| server/utils/mpesa.js | Backend logic |
| client/.../financeService.js | API calls |

---

## 🚀 What's Next

1. Get M-Pesa credentials from Daraja
2. Set .env variables
3. Test with sandbox account
4. Deploy to production
5. Configure webhook callbacks

---

**Need Help?** See MPESA_SETUP.md for full documentation.
