import { useState, useEffect } from 'react';

const USER_KEY = 'financial_app_user';

export const useUser = () => {
  const [userName, setUserName] = useState(() => {
    try {
      return window.localStorage.getItem(USER_KEY) || '';
    } catch (error) {
      return '';
    }
  });

  const saveUserName = (name) => {
    if (name.trim()) {
      setUserName(name.trim());
      window.localStorage.setItem(USER_KEY, name.trim());
    }
  };

  const clearUser = () => {
    setUserName('');
    window.localStorage.removeItem(USER_KEY);
  };

  return { userName, saveUserName, clearUser };
};
