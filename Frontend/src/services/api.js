import axios from 'axios'

const defaultApiBaseUrl = 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: defaultApiBaseUrl,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
