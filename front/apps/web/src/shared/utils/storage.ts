export const storage = {
  getToken: (): string | null => {
    return localStorage.getItem('toursales_access_token');
  },
  setToken: (token: string): void => {
    localStorage.setItem('toursales_access_token', token);
  },
  removeToken: (): void => {
    localStorage.removeItem('toursales_access_token');
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem('toursales_refresh_token');
  },
  setRefreshToken: (token: string): void => {
    localStorage.setItem('toursales_refresh_token', token);
  },
  removeRefreshToken: (): void => {
    localStorage.removeItem('toursales_refresh_token');
  },

  getUser: (): any | null => {
    const raw = localStorage.getItem('toursales_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: any): void => {
    localStorage.setItem('toursales_user', JSON.stringify(user));
  },
  removeUser: (): void => {
    localStorage.removeItem('toursales_user');
  },

  clearAll: (): void => {
    localStorage.removeItem('toursales_access_token');
    localStorage.removeItem('toursales_refresh_token');
    localStorage.removeItem('toursales_user');
  },
};
