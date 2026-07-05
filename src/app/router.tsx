import { createBrowserRouter, Navigate } from 'react-router-dom';
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
// M5 PR#3 (2026-07-22+): /decks · /decks/:deckId hard redirect → /review.
// PR#1의 <DeckDeprecatedBanner>는 dead code (실 진입 불가) · PR#5에서 물리 삭제 예정.
// 저장 URL 방어 6개월 유지 정책.
import { ConceptsEditPage } from '@/features/learning-facade/ConceptsEditPage';
import { LearningFacadePage } from '@/features/learning-facade/LearningFacadePage';
import { LayersListPage } from '@/features/layers/LayersListPage';
import { LayerDetailPage } from '@/features/layers/LayerDetailPage';
import { AxisDetailPage } from '@/features/axes/AxisDetailPage';
import { DailyBatchLandingPage } from '@/features/review/DailyBatchLandingPage';

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
    path: '/review',
    element: (
      <ProtectedRoute requireConcept>
        <DailyBatchLandingPage />
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
    element: <Navigate to="/review" replace />,
  },
  {
    path: '/decks/:deckId',
    element: <Navigate to="/review" replace />,
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
    path: '/learning-facade',
    element: (
      <ProtectedRoute>
        <LearningFacadePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/layers',
    element: (
      <ProtectedRoute>
        <LayersListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/layers/:layerId',
    element: (
      <ProtectedRoute>
        <LayerDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/axes/:axisId',
    element: (
      <ProtectedRoute>
        <AxisDetailPage />
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
