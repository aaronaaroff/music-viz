import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

export function getPageTitle(pageName: string, subtitle?: string): string {
  const baseTitle = 'Vüzik';
  
  if (subtitle) {
    return `${baseTitle} - ${subtitle} | ${pageName}`;
  }
  
  return `${baseTitle} - ${pageName}`;
}