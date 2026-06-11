import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/features/landing/LandingPage';
import { NotFoundPage } from '@/features/not-found/NotFoundPage';
import { PlaceholderPage } from '@/features/placeholders/PlaceholderPage';
import { StudyPage } from '@/features/cards/StudyPage';
import { ArchivePage } from '@/features/cards/ArchivePage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/study', element: <StudyPage /> },
  { path: '/map', element: <PlaceholderPage title="학습 지도" /> },
  { path: '/archive', element: <ArchivePage /> },
  { path: '*', element: <NotFoundPage /> },
]);
