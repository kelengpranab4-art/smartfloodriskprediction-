import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');
const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws') + '/ws/alerts';

const api = axios.create({
  baseURL: apiBaseUrl,
});

export default api;
export { apiBaseUrl, wsBaseUrl };
