import type { ReactNode } from 'react';

import { AchievementProvider } from '@/contexts/AchievementContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { AppealProvider } from '@/contexts/AppealContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CommentProvider } from '@/contexts/CommentContext';
import { CookingProvider } from '@/contexts/CookingContext';
import { IngredientProvider } from '@/contexts/IngredientContext';
import { LanguageContextProvider } from '@/contexts/LanguageContext';
import { MailProvider } from '@/contexts/MailContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { RecipeProvider } from '@/contexts/RecipeContext';
import { SupportProvider } from '@/contexts/SupportContext';
import { MaintenanceGate } from '@/components/MaintenanceGate';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageContextProvider>
        <AuthProvider>
          <MaintenanceGate>
          <AdminProvider>
            <RecipeProvider>
              <IngredientProvider>
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
              </IngredientProvider>
            </RecipeProvider>
          </AdminProvider>
          </MaintenanceGate>
        </AuthProvider>
      </LanguageContextProvider>
    </ThemeProvider>
  );
}
