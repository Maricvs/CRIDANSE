import axios from 'axios';

interface AuthResponse {
  token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    is_admin: boolean;
  };
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: any | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private failedQueue: any[] = [];

  private constructor() {
    // Восстанавливаем сессию из localStorage при инициализации
    const savedToken = localStorage.getItem('admin_token');
    const savedRefreshToken = localStorage.getItem('admin_refresh_token');
    const savedUser = localStorage.getItem('admin_user');
    if (savedToken && savedUser) {
      this.token = savedToken;
      this.refreshToken = savedRefreshToken;
      this.user = JSON.parse(savedUser);
      this.setupAxiosInterceptors();
    }
  }

  private setupAxiosInterceptors() {
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            });
          }
          
          originalRequest._retry = true;
          this.isRefreshing = true;
          
          try {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
              this.processQueue(null);
              return axios(originalRequest);
            }
            this.processQueue(error);
            return Promise.reject(error);
          } catch (err) {
            this.processQueue(err);
            return Promise.reject(err);
          } finally {
            this.isRefreshing = false;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve();
      }
    });
    this.failedQueue = [];
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      if (!this.refreshToken) {
        return false;
      }
      
      const response = await axios.post<AuthResponse>(
        `${import.meta.env.VITE_API_URL}/api/admin/auth/refresh`,
        { refresh_token: this.refreshToken }
      );

      this.token = response.data.token;
      this.refreshToken = response.data.refresh_token;
      
      localStorage.setItem('admin_token', this.token);
      localStorage.setItem('admin_refresh_token', this.refreshToken);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  public async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await axios.post<AuthResponse>(
        `${import.meta.env.VITE_API_URL}/api/admin/auth/login`,
        { username, password }
      );

      if (response.data.user.is_admin) {
        this.token = response.data.token;
        this.refreshToken = response.data.refresh_token;
        this.user = response.data.user;
        
        // Сохраняем данные в localStorage
        localStorage.setItem('admin_token', this.token);
        localStorage.setItem('admin_refresh_token', this.refreshToken);
        localStorage.setItem('admin_user', JSON.stringify(this.user));
        
        // Устанавливаем токен для всех последующих запросов
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        
        // Устанавливаем интерцепторы после успешного логина
        this.setupAxiosInterceptors();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  public logout(): void {
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    delete axios.defaults.headers.common['Authorization'];
  }

  public isAuthenticated(): boolean {
    return !!this.token && !!this.user?.is_admin;
  }

  public getToken(): string | null {
    return this.token;
  }

  public getUser(): any | null {
    return this.user;
  }
}

export const authService = AuthService.getInstance();