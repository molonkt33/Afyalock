import api from "./api";

// Get all prescriptions
export const getPrescriptions = async () => {
  const { data } = await api.get("/prescriptions");
  return data;
};

// Get prescriptions for a specific patient
export const getPatientPrescriptions = async (patientId) => {
  const { data } = await api.get(`/prescriptions/patient/${patientId}`);
  return data;
};

// Create new prescription
export const createPrescription = async (prescriptionData) => {
  const { data } = await api.post("/prescriptions", prescriptionData);
  return data;
};

// Update prescription
export const updatePrescription = async (id, prescriptionData) => {
  const { data } = await api.put(`/prescriptions/${id}`, prescriptionData);
  return data;
};

// Delete prescription
export const deletePrescription = async (id) => {
  const { data } = await api.delete(`/prescriptions/${id}`);
  return data;
};

