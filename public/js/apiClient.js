/* eslint-disable */
import axios from 'axios';

const apiClient = axios.create({
  baseURL: globalThis.__API_BASE_URL__ || undefined,
  withCredentials: true,
});

export default apiClient;
