import React, { createContext, useContext, useState, useEffect } from 'react';

const CreditContext = createContext();

export const useCredits = () => {
  return useContext(CreditContext);
};

export const CreditProvider = ({ children }) => {
  const [credits, setCredits] = useState(150); // Default starting credits
  const [transactions, setTransactions] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCredits = localStorage.getItem('kolomflow_credits');
    const savedTransactions = localStorage.getItem('kolomflow_transactions');
    
    if (savedCredits !== null) {
      setCredits(parseInt(savedCredits, 10));
    }
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
  }, []);

  // Save to localStorage whenever credits or transactions change
  useEffect(() => {
    localStorage.setItem('kolomflow_credits', credits.toString());
    localStorage.setItem('kolomflow_transactions', JSON.stringify(transactions));
  }, [credits, transactions]);

  const addCredits = (amount, reason) => {
    setCredits((prev) => prev + amount);
    setTransactions((prev) => [
      { id: Date.now(), type: 'earn', amount, reason, date: new Date().toISOString() },
      ...prev
    ]);
  };

  const deductCredits = (amount, reason) => {
    if (credits >= amount) {
      setCredits((prev) => prev - amount);
      setTransactions((prev) => [
        { id: Date.now(), type: 'spend', amount, reason, date: new Date().toISOString() },
        ...prev
      ]);
      return true;
    }
    return false; // Not enough credits
  };

  return (
    <CreditContext.Provider value={{ credits, transactions, addCredits, deductCredits }}>
      {children}
    </CreditContext.Provider>
  );
};
