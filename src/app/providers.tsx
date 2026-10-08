import type { ReactNode } from 'react';

import { AuthProvider } from '@/contexts/AuthContext';
import { CookingProvider } from '@/contexts/CookingContext';
import { RecipeProvider } from '@/contexts/RecipeContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RecipeProvider>
        <CookingProvider>{children}</CookingProvider>
      </RecipeProvider>
    </AuthProvider>
  );
}
