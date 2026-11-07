import { HashRouter } from 'react-router';
import { AppShell } from './AppShell';
import { ErrorBoundary } from './ErrorBoundary';
import { PwaNotices } from './PwaNotices';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <ErrorBoundary scope="root">
      <HashRouter>
        <AppShell>
          <PwaNotices />
          <AppRoutes />
        </AppShell>
      </HashRouter>
    </ErrorBoundary>
  );
}
