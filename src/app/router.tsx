import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AdminHomePage from '@/pages/admin/AdminHomePage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import EditorHomePage from '@/pages/editor/EditorHomePage';
import HomePage from '@/pages/player/HomePage';
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
        element: <EditorHomePage />,
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        path: '/admin',
        element: <AdminHomePage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
