import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';

/**
 * Mirrors the reference project's routes/PrivateRoutes.tsx: gates a route
 * behind an authenticated session, redirecting to /login otherwise.
 */
export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  if (!accessToken) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
