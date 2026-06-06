import { useState, useEffect } from 'react';

const SUBS_KEY = 'financial_app_subscriptions';

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      const item = window.localStorage.getItem(SUBS_KEY);
      return item ? JSON.parse(item) : [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(SUBS_KEY, JSON.stringify(subscriptions));
  }, [subscriptions]);

  const addSubscription = (sub) => {
    setSubscriptions(prev => [
      ...prev,
      { ...sub, id: crypto.randomUUID() }
    ]);
  };

  const deleteSubscription = (id) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  return { subscriptions, addSubscription, deleteSubscription };
};
