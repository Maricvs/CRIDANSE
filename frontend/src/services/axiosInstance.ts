import axios from 'axios';

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Изначально подставляем токен
const userToken = localStorage.getItem('user_token');
if (userToken) {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
}

// Перехватчик для обработки 401 ошибок
axiosInstance.interceptors.response.use(
  (response: axios.AxiosResponse) => response,
  async (error: axios.AxiosError) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('user_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<RefreshTokenResponse>('/api/auth/user/refresh', { refresh_token: refreshToken });

        const { access_token, refresh_token } = response.data;

        // Сохраняем новые токены
        localStorage.setItem('user_token', access_token);
        localStorage.setItem('user_refresh_token', refresh_token);

        // Обновляем заголовки
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        if (originalRequest?.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Очистка токенов если рефреш не сработал
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_refresh_token');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;