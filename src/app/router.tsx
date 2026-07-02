import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/features/landing/LandingPage';
import { NotFoundPage } from '@/features/not-found/NotFoundPage';
import { MaintenancePage } from '@/features/error/MaintenancePage';
import { StudyPage } from '@/features/cards/StudyPage';
import { ArchivePage } from '@/features/cards/ArchivePage';
import { CardDetailPage } from '@/features/cards/CardDetailPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignupPage } from '@/features/auth/SignupPage';
import { OAuthCallbackPage } from '@/features/auth/OAuthCallbackPage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { HomePage } from '@/features/home/HomePage';
import { CardEditorPage } from '@/features/card-editor/CardEditorPage';
import { MePage } from '@/features/me/MePage';
import { MapPage } from '@/features/map/MapPage';
import { TagsListPage } from '@/features/tags/TagsListPage';
import { TagDetailPage } from '@/features/tags/TagDetailPage';
import { DecksPage } from '@/features/decks/DecksPage';
import { ConceptsEditPage } from '@/features/learning-facade/ConceptsEditPage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/oauth/:provider/callback', element: <OAuthCallbackPage /> },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute redirectIfConcept="/home">
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
    path: '/decks',
    element: (
      <ProtectedRoute requireConcept>
        <DecksPage />
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
  {
    path: '/learning-facade/concepts',
    element: (
      <ProtectedRoute>
        <ConceptsEditPage />
      </ProtectedRoute>
    ),
  },
  { path: '/maintenance', element: <MaintenancePage /> },
  { path: '*', element: <NotFoundPage /> },
]);
