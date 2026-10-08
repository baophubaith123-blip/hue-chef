import type { ReactNode } from 'react';

import { AuthProvider } from '@/contexts/AuthContext';
import { CookingProvider } from '@/contexts/CookingContext';
import { LanguageContextProvider } from '@/contexts/LanguageContext';
import { MailProvider } from '@/contexts/MailContext';
import { RecipeProvider } from '@/contexts/RecipeContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageContextProvider>
        <AuthProvider>
          <RecipeProvider>
            <MailProvider>
              <CookingProvider>{children}</CookingProvider>
            </MailProvider>
          </RecipeProvider>
        </AuthProvider>
      </LanguageContextProvider>
    </ThemeProvider>
  );
}
