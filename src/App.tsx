import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider, useAuth } from '@/components/auth-context';
import { RealtimeProvider } from '@/lib/realtime/context';
import { AppSidebar } from '@/components/app-sidebar';
import { routes, defaultRoute } from '@/routes';
import type { AppRoute } from '@/routes';
import { Spinner } from '@/components/ui/spinner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground"><Spinner/>Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppSidebar>{children}</AppSidebar>;
}

function PublicRoute({ element }: { element: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground"><Spinner/>Cargando...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{element}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <RealtimeProvider>
            <BrowserRouter>
              <Routes>
                {routes.map((route: AppRoute) => {
                  if (route.protected) {
                    return (
                      <Route
                        key={route.path}
                        path={route.path}
                        element={
                          <ProtectedRoute>
                            {route.element}
                          </ProtectedRoute>
                        }
                      />
                    );
                  } else {
                    return (
                      <Route
                        key={route.path}
                        path={route.path}
                        element={
                          <PublicRoute element={route.element} />
                        }
                      />
                    );
                  }
                })}
                <Route path="*" element={<Navigate to={defaultRoute} replace />} />
              </Routes>
            </BrowserRouter>
          </RealtimeProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
