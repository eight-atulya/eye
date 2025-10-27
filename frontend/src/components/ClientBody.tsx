'use client';

import { useEffect, useState } from 'react';

interface ClientBodyProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Client-side body component that handles browser extension interference
 * This prevents hydration mismatches caused by browser extensions
 */
export const ClientBody = ({ children, className = "bg-white text-gray-900" }: ClientBodyProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after client-side rendering
    setIsHydrated(true);
    
    // Handle browser extension interference
    const handleExtensionInterference = () => {
      const body = document.body;
      if (body) {
        // Remove extension-added classes that cause hydration mismatches
        const extensionClasses = [
          'clickup-chrome-ext_installed',
          'chrome-extension-installed',
          'browser-extension-active',
          'ext-installed',
          'extension-active'
        ];
        
        extensionClasses.forEach(className => {
          if (body.classList.contains(className)) {
            body.classList.remove(className);
          }
        });
      }
    };

    // Run cleanup after hydration
    const timeoutId = setTimeout(handleExtensionInterference, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <body 
      className={className} 
      suppressHydrationWarning={true}
      data-hydrated={isHydrated}
    >
      {children}
    </body>
  );
};
