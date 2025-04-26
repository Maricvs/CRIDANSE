import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен при инициализации
const userToken = localStorage.getItem('user_token');
if (userToken) {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
}

// Перехватчик для обновления токена при 401 ошибке
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Здесь можно добавить логику обновления токена
        // Например, если у нас будет refresh token
        const newToken = localStorage.getItem('user_token');
        if (newToken) {
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Если не удалось обновить токен, перенаправляем на страницу авторизации
        localStorage.removeItem('user_token');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance; 