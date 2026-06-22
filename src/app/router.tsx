import { createBrowserRouter } from 'react-router-dom';
import { BootstrapGate } from '@/features/bootstrap/BootstrapGate';
import { NotFoundPage } from '@/features/not-found/NotFoundPage';
import { MaintenancePage } from '@/features/error/MaintenancePage';
import { StudyPage } from '@/features/cards/StudyPage';
import { ArchivePage } from '@/features/cards/ArchivePage';
import { CardDetailPage } from '@/features/cards/CardDetailPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignupPage } from '@/features/auth/SignupPage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { HomePage } from '@/features/home/HomePage';
import { CardEditorPage } from '@/features/card-editor/CardEditorPage';
import { MePage } from '@/features/me/MePage';
import { MapPage } from '@/features/map/MapPage';
import { TagsListPage } from '@/features/tags/TagsListPage';
import { TagDetailPage } from '@/features/tags/TagDetailPage';

export const router = createBrowserRouter([
  { path: '/', element: <BootstrapGate /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute requireConcept>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/study',
    element: (
      <ProtectedRoute requireConcept>
        <StudyPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/cards/new',
    element: (
      <ProtectedRoute requireConcept>
        <CardEditorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/me',
    element: (
      <ProtectedRoute>
        <MePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/map',
    element: (
      <ProtectedRoute requireConcept>
        <MapPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/archive',
    element: (
      <ProtectedRoute requireConcept>
        <ArchivePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/archive/:cardId',
    element: (
      <ProtectedRoute requireConcept>
        <CardDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tags',
    element: (
      <ProtectedRoute requireConcept>
        <TagsListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tags/:tagId',
    element: (
      <ProtectedRoute requireConcept>
        <TagDetailPage />
      </ProtectedRoute>
    ),
  },
  { path: '/maintenance', element: <MaintenancePage /> },
  { path: '*', element: <NotFoundPage /> },
]);
