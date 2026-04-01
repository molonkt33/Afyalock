# Dropdown Menu Fix TODO

## Task
Add onClick handlers to dropdown menu items in card components across all pages.

## Files to Fix:
1. [x] ActivePatients.jsx - Add handlers for Star, View Details, Remove
2. [x] OutPatients.jsx - Add handlers for Star, View Details, Remove  
3. [x] Emergency.jsx - Add handlers for Star, Update Status, View Details, Remove
4. [x] Lab.jsx - Add handlers for Star, View Details (upload already has handler)
5. [x] Radiology.jsx - Add handlers for Star, View Details, Upload Scan, Update Status, Remove
6. [x] PatientHistory.jsx - Add handlers for Star, View Details, Remove
7. [x] StaffOverview.jsx - Need to verify and fix if needed

## Functionality to Implement:
- Star/Favorite: Toggle star status (local state)
- View Details: Open a modal or navigate to details
- Remove: Show confirmation and delete the record via API
- Update Status: Open modal to update status
- Upload: Already implemented in Lab.jsx

