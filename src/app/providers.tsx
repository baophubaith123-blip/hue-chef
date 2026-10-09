import type { ReactNode } from 'react';

import { AchievementProvider } from '@/contexts/AchievementContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { AppealProvider } from '@/contexts/AppealContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CommentProvider } from '@/contexts/CommentContext';
import { CookingProvider } from '@/contexts/CookingContext';
import { LanguageContextProvider } from '@/contexts/LanguageContext';
import { MailProvider } from '@/contexts/MailContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { RecipeProvider } from '@/contexts/RecipeContext';
import { SupportProvider } from '@/contexts/SupportContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageContextProvider>
        <AuthProvider>
          <AdminProvider>
            <RecipeProvider>
              <MailProvider>
                <CookingProvider>
                  <AchievementProvider>
                    <NotificationProvider>
                      <SupportProvider>
                        <AppealProvider>
                          <CommentProvider>{children}</CommentProvider>
                        </AppealProvider>
                      </SupportProvider>
                    </NotificationProvider>
                  </AchievementProvider>
                </CookingProvider>
              </MailProvider>
            </RecipeProvider>
          </AdminProvider>
        </AuthProvider>
      </LanguageContextProvider>
    </ThemeProvider>
  );
}
