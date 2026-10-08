import type { ReactNode } from 'react';

import { AppealProvider } from '@/contexts/AppealContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CookingProvider } from '@/contexts/CookingContext';
import { LanguageContextProvider } from '@/contexts/LanguageContext';
import { MailProvider } from '@/contexts/MailContext';
import { RecipeProvider } from '@/contexts/RecipeContext';
import { SupportProvider } from '@/contexts/SupportContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageContextProvider>
        <AuthProvider>
          <RecipeProvider>
            <MailProvider>
              <CookingProvider>
                <SupportProvider>
                  <AppealProvider>{children}</AppealProvider>
                </SupportProvider>
              </CookingProvider>
            </MailProvider>
          </RecipeProvider>
        </AuthProvider>
      </LanguageContextProvider>
    </ThemeProvider>
  );
}
