import axios from "axios";

const API = axios.create({
  baseURL: "https://eventsmanagementprojback.onrender.com/api",
});

// 🔹 Attach token to requests
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// 🔹 Event API Calls
export const fetchEvents = () => API.get("/events");

// ✅ Handle Image Uploads for Event Creation
export const createEvent = (eventData) =>
  API.post("/events", eventData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ✅ Handle Image Uploads for Event Updates
export const updateEvent = (id, eventData) =>
  API.put(`/events/${id}`, eventData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const joinEvent = (id) => API.post(`/events/${id}/join`);
export const deleteEvent = (id) => API.delete(`/events/${id}`);

export default API;
