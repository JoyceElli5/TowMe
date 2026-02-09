

import React, { createContext, useContext, useState, useCallback } from 'react';

interface TabBarContextType {
  isVisible: boolean;
  showTabBar: () => void;
  hideTabBar: () => void;
}

const TabBarContext = createContext<TabBarContextType>({
  isVisible: true,
  showTabBar: () => {},
  hideTabBar: () => {},
});

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);

  const showTabBar = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hideTabBar = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <TabBarContext.Provider value={{ isVisible, showTabBar, hideTabBar }}>
      {children}
    </TabBarContext.Provider>
  );
}

export function useTabBar() {
  return useContext(TabBarContext);
}
