import { useState, useEffect } from 'react';

const TOKEN_KEY = 'store_cart_token';

export function useCartToken() {
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem(TOKEN_KEY) || '';
  });

  useEffect(() => {
    if (!token) {
      const newToken = crypto.randomUUID();
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
    }
  }, [token]);

  const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
  };

  return { token, clearToken };
}
