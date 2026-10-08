import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AdminBroadcastPage from '@/pages/admin/AdminBroadcastPage';
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
import InboxPage from '@/pages/player/InboxPage';
import PlayerMailDetailPage from '@/pages/player/PlayerMailDetailPage';
import RecipeDetailPage from '@/pages/player/RecipeDetailPage';
import RecipeListPage from '@/pages/player/RecipeListPage';
import SupportAppealDetailPage from '@/pages/support/SupportAppealDetailPage';
import SupportAppealsPage from '@/pages/support/SupportAppealsPage';
import SupportChatPage from '@/pages/support/SupportChatPage';
import SupportDashboardPage from '@/pages/support/SupportDashboardPage';

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
      {
        path: '/inbox',
        element: <InboxPage />,
      },
      {
        path: '/inbox/:id',
        element: <PlayerMailDetailPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['support']} />,
    children: [
      {
        path: '/support',
        element: <SupportDashboardPage />,
      },
      {
        path: '/support/appeals',
        element: <SupportAppealsPage />,
      },
      {
        path: '/support/appeals/:id',
        element: <SupportAppealDetailPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['player', 'support']} />,
    children: [
      {
        path: '/support/chat',
        element: <SupportChatPage />,
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
      {
        path: '/admin/broadcast',
        element: <AdminBroadcastPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
