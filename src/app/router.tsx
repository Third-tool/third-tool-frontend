import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/features/landing/LandingPage';
import { NotFoundPage } from '@/features/not-found/NotFoundPage';
import { PlaceholderPage } from '@/features/placeholders/PlaceholderPage';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/study', element: <PlaceholderPage title="오늘의 카드" /> },
  { path: '/map', element: <PlaceholderPage title="학습 지도" /> },
  { path: '/archive', element: <PlaceholderPage title="배경 지식 서가" /> },
  { path: '*', element: <NotFoundPage /> },
]);
