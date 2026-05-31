import { useEffect, useState } from 'react';

/** Reaktiver Hook: gibt true zurück wenn data-theme="light" auf <html> gesetzt ist */
export function useTheme() {
  const [isLight, setIsLight] = useState(
    () => document.documentElement.dataset.theme === 'light'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.dataset.theme === 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return { isLight, isDark: !isLight };
}
