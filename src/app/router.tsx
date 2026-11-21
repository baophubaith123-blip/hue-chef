import { createBrowserRouter } from 'react-router-dom';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MusicLayout } from '@/features/audio/MusicDirector';
import AdminAchievementsPage from '@/pages/admin/AdminAchievementsPage';
import AdminAllRecipesPage from '@/pages/admin/AdminAllRecipesPage';
import AdminAppealsPage from '@/pages/admin/AdminAppealsPage';
import AdminAuditLogPage from '@/pages/admin/AdminAuditLogPage';
import AdminBackupPage from '@/pages/admin/AdminBackupPage';
import AdminBroadcastPage from '@/pages/admin/AdminBroadcastPage';
import AdminCommentsPage from '@/pages/admin/AdminCommentsPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
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
import TitleScreen from '@/pages/common/TitleScreen';
import NotFoundPage from '@/pages/common/NotFoundPage';
import EditorAchievementsPage from '@/pages/editor/EditorAchievementsPage';
import EditorDashboardPage from '@/pages/editor/EditorDashboardPage';
import EditorIngredientsPage from '@/pages/editor/EditorIngredientsPage';
import EditorMyRecipesPage from '@/pages/editor/EditorMyRecipesPage';
import EditorRecipeDetailPage from '@/pages/editor/EditorRecipeDetailPage';
import EditorRecipeFormPage from '@/pages/editor/EditorRecipeFormPage';
import AchievementsPage from '@/pages/player/AchievementsPage';
import AlbumPage from '@/pages/player/AlbumPage';
import MysteryPage from '@/pages/player/MysteryPage';
import OnlinePage from '@/pages/player/OnlinePage';
import OnlineDuelsPage from '@/pages/player/OnlineDuelsPage';
import OnlineTournamentPage from '@/pages/player/OnlineTournamentPage';
import OnlineVisitPage from '@/pages/player/OnlineVisitPage';
import OnlineVisitStallPage from '@/pages/player/OnlineVisitStallPage';
import QuestsPage from '@/pages/player/QuestsPage';
import SkillTreePage from '@/pages/player/SkillTreePage';
import SurvivalPage from '@/pages/player/SurvivalPage';
import CollectionPage from '@/pages/player/CollectionPage';
import CookingPage from '@/pages/player/CookingPage';
import HomePage from '@/pages/player/HomePage';
import HueMapPage from '@/pages/player/HueMapPage';
import MarketPage from '@/pages/player/MarketPage';
import StallPage from '@/pages/player/StallPage';
import InboxPage from '@/pages/player/InboxPage';
import LeaderboardPage from '@/pages/player/LeaderboardPage';
import PlayerMailDetailPage from '@/pages/player/PlayerMailDetailPage';
import ProfilePage from '@/pages/player/ProfilePage';
import RecipeDetailPage from '@/pages/player/RecipeDetailPage';
import RecipeListPage from '@/pages/player/RecipeListPage';
import SupportAppealDetailPage from '@/pages/support/SupportAppealDetailPage';
import SupportAppealsPage from '@/pages/support/SupportAppealsPage';
import SupportChatPage from '@/pages/support/SupportChatPage';
import SupportDashboardPage from '@/pages/support/SupportDashboardPage';

export const router = createBrowserRouter([
  {
    // Root layout (Gói H8): the music director watches the route and
    // the stall state from here so every page gets the right track.
    element: <MusicLayout />,
    children: [
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
    path: '/',
    element: <TitleScreen />,
  },
  {
    element: <ProtectedRoute allowedRoles={['player']} />,
    children: [
      {
        path: '/home',
        element: <HomePage />,
      },
      {
        path: '/recipes',
        element: <RecipeListPage />,
      },
      {
        path: '/map',
        element: <HueMapPage />,
      },
      {
        path: '/album',
        element: <AlbumPage />,
      },
      {
        path: '/skills',
        element: <SkillTreePage />,
      },
      {
        path: '/quests',
        element: <QuestsPage />,
      },
      {
        path: '/survival',
        element: <SurvivalPage />,
      },
      {
        path: '/mystery',
        element: <MysteryPage />,
      },
      {
        path: '/online',
        element: <OnlinePage />,
      },
      {
        path: '/online/duels',
        element: <OnlineDuelsPage />,
      },
      {
        path: '/online/tournament',
        element: <OnlineTournamentPage />,
      },
      {
        path: '/online/visit',
        element: <OnlineVisitPage />,
      },
      {
        path: '/online/visit/:userId',
        element: <OnlineVisitStallPage />,
      },
      {
        path: '/stall',
        element: <StallPage />,
      },
      {
        path: '/market',
        element: <MarketPage />,
      },
      {
        path: '/recipes/:id',
        element: <RecipeDetailPage />,
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
      {
        path: '/leaderboard',
        element: <LeaderboardPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/profile/:id',
        element: <ProfilePage />,
      },
    ],
  },
  {
    // Cooking is playable by players; editors/admins may open it only in
    // ?preview=1 mode (enforced inside CookingPage) to test a dish.
    element: <ProtectedRoute allowedRoles={['player', 'editor', 'admin']} />,
    children: [
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
      {
        path: '/editor/achievements',
        element: <EditorAchievementsPage />,
      },
      {
        path: '/editor/ingredients',
        element: <EditorIngredientsPage />,
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
    ],
  },
]);
