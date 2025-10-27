'use client';

import { useEffect, useState } from 'react';

/**
 * Custom hook to handle browser extension interference with hydration
 * This prevents hydration mismatches caused by browser extensions that modify the DOM
 */
export const useBrowserExtensions = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Clean up any extension-added classes that might cause hydration issues
    const cleanupExtensionClasses = () => {
      const body = document.body;
      if (body) {
        // Remove common extension-added classes that cause hydration mismatches
        const extensionClasses = [
          'clickup-chrome-ext_installed',
          'chrome-extension-installed',
          'browser-extension-active',
          'ext-installed'
        ];
        
        extensionClasses.forEach(className => {
          if (body.classList.contains(className)) {
            body.classList.remove(className);
          }
        });
      }
    };

    // Run cleanup after a short delay to ensure extensions have finished loading
    const timeoutId = setTimeout(cleanupExtensionClasses, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return { isClient };
};
