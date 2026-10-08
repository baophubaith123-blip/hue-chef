import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminReviewDetailPage from '@/pages/admin/AdminReviewDetailPage';
import AdminReviewPage from '@/pages/admin/AdminReviewPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import EditorDashboardPage from '@/pages/editor/EditorDashboardPage';
import EditorMyRecipesPage from '@/pages/editor/EditorMyRecipesPage';
import EditorRecipeDetailPage from '@/pages/editor/EditorRecipeDetailPage';
import EditorRecipeFormPage from '@/pages/editor/EditorRecipeFormPage';
import CookingPage from '@/pages/player/CookingPage';
import HomePage from '@/pages/player/HomePage';
import RecipeDetailPage from '@/pages/player/RecipeDetailPage';
import RecipeListPage from '@/pages/player/RecipeListPage';
import SupportHomePage from '@/pages/support/SupportHomePage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute allowedRoles={['player']} />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/recipes',
        element: <RecipeListPage />,
      },
      {
        path: '/recipes/:id',
        element: <RecipeDetailPage />,
      },
      {
        path: '/cooking/:id',
        element: <CookingPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['support']} />,
    children: [
      {
        path: '/support',
        element: <SupportHomePage />,
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['editor']} />,
    children: [
      {
        path: '/editor',
        element: <EditorDashboardPage />,
      },
      {
        path: '/editor/recipes',
        element: <EditorMyRecipesPage />,
      },
      {
        path: '/editor/recipes/new',
        element: <EditorRecipeFormPage />,
      },
      {
        path: '/editor/recipes/:id',
        element: <EditorRecipeDetailPage />,
      },
      {
        path: '/editor/recipes/:id/edit',
        element: <EditorRecipeFormPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        path: '/admin',
        element: <AdminDashboardPage />,
      },
      {
        path: '/admin/review',
        element: <AdminReviewPage />,
      },
      {
        path: '/admin/review/:id',
        element: <AdminReviewDetailPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
