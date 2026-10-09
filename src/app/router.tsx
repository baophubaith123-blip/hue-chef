import { createBrowserRouter } from 'react-router-dom';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AdminAchievementsPage from '@/pages/admin/AdminAchievementsPage';
import AdminAllRecipesPage from '@/pages/admin/AdminAllRecipesPage';
import AdminAppealsPage from '@/pages/admin/AdminAppealsPage';
import AdminAuditLogPage from '@/pages/admin/AdminAuditLogPage';
import AdminBackupPage from '@/pages/admin/AdminBackupPage';
import AdminBroadcastPage from '@/pages/admin/AdminBroadcastPage';
import AdminCommentsPage from '@/pages/admin/AdminCommentsPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminIngredientsPage from '@/pages/admin/AdminIngredientsPage';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';
import AdminReviewDetailPage from '@/pages/admin/AdminReviewDetailPage';
import AdminReviewPage from '@/pages/admin/AdminReviewPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AdminUserDetailPage from '@/pages/admin/AdminUserDetailPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import AboutPage from '@/pages/common/AboutPage';
import FeedbackPage from '@/pages/common/FeedbackPage';
import HelpPage from '@/pages/common/HelpPage';
import NotFoundPage from '@/pages/common/NotFoundPage';
import EditorDashboardPage from '@/pages/editor/EditorDashboardPage';
import EditorMyRecipesPage from '@/pages/editor/EditorMyRecipesPage';
import EditorRecipeDetailPage from '@/pages/editor/EditorRecipeDetailPage';
import EditorRecipeFormPage from '@/pages/editor/EditorRecipeFormPage';
import AchievementsPage from '@/pages/player/AchievementsPage';
import CollectionPage from '@/pages/player/CollectionPage';
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
    path: '/help',
    element: <HelpPage />,
  },
  {
    path: '/feedback',
    element: <FeedbackPage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
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
      {
        path: '/achievements',
        element: <AchievementsPage />,
      },
      {
        path: '/collection',
        element: <CollectionPage />,
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
      {
        path: '/admin/users',
        element: <AdminUsersPage />,
      },
      {
        path: '/admin/users/:id',
        element: <AdminUserDetailPage />,
      },
      {
        path: '/admin/recipes',
        element: <AdminAllRecipesPage />,
      },
      {
        path: '/admin/achievements',
        element: <AdminAchievementsPage />,
      },
      {
        path: '/admin/ingredients',
        element: <AdminIngredientsPage />,
      },
      {
        path: '/admin/comments',
        element: <AdminCommentsPage />,
      },
      {
        path: '/admin/reports',
        element: <AdminReportsPage />,
      },
      {
        path: '/admin/appeals',
        element: <AdminAppealsPage />,
      },
      {
        path: '/admin/settings',
        element: <AdminSettingsPage />,
      },
      {
        path: '/admin/audit-log',
        element: <AdminAuditLogPage />,
      },
      {
        path: '/admin/backup',
        element: <AdminBackupPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
