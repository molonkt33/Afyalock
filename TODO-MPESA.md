# M-Pesa STK Payment for Prescriptions
## Status: 📋 Planning

### Plan:
1. **Model**: Add `totalAmount`, `paymentMethod`, `paymentStatus`, `mpesaRef` to Prescription
2. **Backend**: 
   - Daraja API config (.env: CONSUMER_KEY, PASSKEY)
   - `/api/mpesa/stk/:prescriptionId` - STK push
3. **Frontend**: 
   - Prescription form: auto-totalAmount, M-Pesa button
   - Existing prescriptions: 'Pay with M-Pesa' button
4. **Webhook**: M-Pesa callback validation (future)

### Dependent Files:
- server/models/Prescription.js
- client/src/pages/Prescriptions.jsx
- server/controllers/prescriptionController.js
- server/routes/prescriptionRoutes.js

**Next**: Add payment fields to model. Confirm M-Pesa credentials ready?
