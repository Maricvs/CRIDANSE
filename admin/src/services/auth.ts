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

  private constructor() {
    // Восстанавливаем сессию из localStorage при инициализации
    const savedToken = localStorage.getItem('admin_token');
    const savedUser = localStorage.getItem('admin_user');
    if (savedToken && savedUser) {
      this.token = savedToken;
      this.user = JSON.parse(savedUser);
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
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
        localStorage.setItem('admin_user', JSON.stringify(this.user));
        localStorage.setItem('admin_refresh_token', this.refreshToken);
        // Устанавливаем токен для всех последующих запросов
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        
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
    this.user = null;
    localStorage.removeItem('admin_token');
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