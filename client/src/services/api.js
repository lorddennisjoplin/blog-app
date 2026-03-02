import axios from "axios";

const VITE_API_URL = 'https://blog-app-upf3.onrender.com'

const api = axios.create({
  // baseURL: import.meta.env.VITE_API_URL
  baseURL: VITE_API_URL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config;
});

export default api;