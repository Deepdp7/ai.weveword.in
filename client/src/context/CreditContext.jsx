import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CreditContext = createContext();

export const useCredits = () => {
  return useContext(CreditContext);
};

export const CreditProvider = ({ children }) => {
  const { user } = useAuth();
  const [credits, setCredits] = useState(150);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCreditData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [balRes, txRes] = await Promise.all([
        axios.get('/payments/credits/balance'),
        axios.get('/payments/transactions')
      ]);
      if (balRes.data && balRes.data.status === 'success') {
        setCredits(balRes.data.credits);
      }
      if (txRes.data) {
        // Support both array response or object containing array
        const list = Array.isArray(txRes.data) ? txRes.data : txRes.data.transactions || [];
        const formatted = list.map(tx => ({
          id: tx._id || Date.now() + Math.random().toString(),
          type: tx.credits > 0 ? 'earn' : 'spend',
          amount: Math.abs(tx.credits),
          reason: tx.description,
          date: tx.createdAt
        }));
        setTransactions(formatted);
      }
    } catch (err) {
      console.warn('Could not sync credits/transactions with backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCreditData();
    } else {
      setCredits(0);
      setTransactions([]);
    }
  }, [user]);

  const addCredits = async (amount, reason) => {
    // Refresh from backend to sync
    await fetchCreditData();
    // Local fallback update for instant UI feedback
    setCredits((prev) => prev + amount);
    setTransactions((prev) => [
      { id: Date.now().toString(), type: 'earn', amount, reason, date: new Date().toISOString() },
      ...prev
    ]);
  };

  const deductCredits = async (amount, reason) => {
    // Local fallback update
    if (credits >= amount) {
      setCredits((prev) => prev - amount);
      setTransactions((prev) => [
        { id: Date.now().toString(), type: 'spend', amount, reason, date: new Date().toISOString() },
        ...prev
      ]);
      return true;
    }
    return false;
  };

  return (
    <CreditContext.Provider value={{ credits, transactions, loading, fetchCreditData, addCredits, deductCredits }}>
      {children}
    </CreditContext.Provider>
  );
};

