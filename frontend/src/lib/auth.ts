export const getToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('accessToken');
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem('accessToken', token);
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem('accessToken');
}; 