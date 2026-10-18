import { Navigate, Route, Routes } from 'react-router-dom';

import { Shell } from './components/Shell';
import { AuthProvider, useAuth } from './lib/auth';
import { CloudSync } from './lib/cloudSync';
import { SettingsProvider } from './lib/settings';
import { TripsProvider } from './lib/trips';
import { ConnectionsPage } from './pages/Connections';
import { PrivacyPage, TermsPage } from './pages/Legal';
import { PreferencesPage } from './pages/Preferences';
import { SignInPage } from './pages/SignIn';
import { TripPage } from './pages/Trip';
import { UpcomingPage } from './pages/Upcoming';

export function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <CloudSync />
        <TripsProvider>
          <Routes>
            {/* Public, so Google's consent screen can link to them without a sign-in. */}
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<Gate />} />
          </Routes>
        </TripsProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

/** Signed in, or continuing as a guest: the app. Otherwise: the welcome screen, whatever the URL. */
function Gate() {
  const { ready, account, guest } = useAuth();
  if (!ready) return null;
  if (!account && !guest) return <SignInPage />;

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<UpcomingPage />} />
        <Route path="/trip/:id" element={<TripPage />} />
        <Route path="/connections" element={<ConnectionsPage />} />
        <Route path="/preferences" element={<PreferencesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
