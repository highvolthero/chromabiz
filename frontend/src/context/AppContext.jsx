import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  PALETTES: 'chromabiz_palettes',
  FAVORITES: 'chromabiz_favorites',
  BUSINESS_INFO: 'chromabiz_business_info',
  CHAT_HISTORY: 'chromabiz_chat_history',
  SESSION_ID: 'chromabiz_session_id'
};

export function AppProvider({ children }) {
  const [palettes, setPalettes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [rateLimits, setRateLimits] = useState({
    generations_remaining: 1,
    revisions_remaining: 3,
    reset_time: ''
  });
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const storedPalettes = localStorage.getItem(STORAGE_KEYS.PALETTES);
    const storedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    const storedBusinessInfo = localStorage.getItem(STORAGE_KEYS.BUSINESS_INFO);
    const storedChatHistory = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    let storedSessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);

    if (storedPalettes) {
      try {
        const parsed = JSON.parse(storedPalettes);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setPalettes(parsed.data || []);
        }
      } catch (e) {
        console.error('Failed to parse stored palettes');
      }
    }

    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites));
      } catch (e) {
        console.error('Failed to parse stored favorites');
      }
    }

    if (storedBusinessInfo) {
      try {
        setBusinessInfo(JSON.parse(storedBusinessInfo));
      } catch (e) {
        console.error('Failed to parse stored business info');
      }
    }

    if (storedChatHistory) {
      try {
        setChatHistory(JSON.parse(storedChatHistory));
      } catch (e) {
        console.error('Failed to parse stored chat history');
      }
    }

    if (!storedSessionId) {
      storedSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  useEffect(() => {
    if (palettes.length > 0) {
      localStorage.setItem(STORAGE_KEYS.PALETTES, JSON.stringify({
        data: palettes,
        timestamp: Date.now()
      }));
    }
  }, [palettes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (businessInfo) {
      localStorage.setItem(STORAGE_KEYS.BUSINESS_INFO, JSON.stringify(businessInfo));
    }
  }, [businessInfo]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(chatHistory));
  }, [chatHistory]);

  const toggleFavorite = useCallback((paletteId) => {
    setFavorites(prev => {
      if (prev.includes(paletteId)) {
        return prev.filter(id => id !== paletteId);
      }
      return [...prev, paletteId];
    });
  }, []);

  const addChatMessage = useCallback((role, content) => {
    setChatHistory(prev => [...prev, { role, content, timestamp: Date.now() }]);
  }, []);

  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
  }, []);

  const clearAllData = useCallback(() => {
    setPalettes([]);
    setFavorites([]);
    setBusinessInfo(null);
    setChatHistory([]);
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
    setSessionId(newSessionId);
  }, []);

  const value = {
    palettes,
    setPalettes,
    favorites,
    toggleFavorite,
    businessInfo,
    setBusinessInfo,
    chatHistory,
    addChatMessage,
    clearChatHistory,
    isGenerating,
    setIsGenerating,
    isChatting,
    setIsChatting,
    rateLimits,
    setRateLimits,
    sessionId,
    clearAllData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
