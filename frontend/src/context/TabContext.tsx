import { createContext, useContext } from 'react';

export interface TabDef {
  key: string;
  label: string;
}

export interface TabContextValue {
  tab: string;
  setTab: (key: string) => void;
  tabs: TabDef[];
  isLoggedIn: boolean;
  onAuthClick: () => void;
  planTitle: string;
  planColor: string;
}

export const TabContext = createContext<TabContextValue>({
  tab: 'main',
  setTab: () => {},
  tabs: [],
  isLoggedIn: false,
  onAuthClick: () => {},
  planTitle: 'Free',
  planColor: '#67e8f9',
});

export function useTabContext() {
  return useContext(TabContext);
}
