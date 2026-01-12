import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/site/HomePage';
import ToolsPage from './pages/site/ToolsPage';
import TacticalMapPage from './pages/tactical-map/TacticalMapPage';
import AboutPage from './pages/site/AboutPage';
import DataAnalyticsPage from './pages/site/DataAnalyticsPage';
import PrivacyPage from './pages/site/PrivacyPage';
import TermsPage from './pages/site/TermsPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardPage from './pages/auth/DashboardPage';
import ScrimSchedulerPage from './pages/auth/ScrimSchedulerPage';
import TeamManagerPage from './pages/auth/TeamManagerPage';
import TeamsPage from './pages/TeamsPage';
import ProfilePage from './pages/auth/ProfilePage';
import SettingsPage from './pages/auth/SettingsPage';
import AdminPage from './pages/auth/AdminPage';
import RiotCallbackPage from './pages/auth/RiotCallbackPage';
import FavoriteToolsPage from './pages/auth/FavoriteToolsPage';
import { AuthProvider } from './contexts/AuthContext';
import { TeamProvider } from './contexts/TeamContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import ErrorPage from './pages/ErrorPage';

export default function App() {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <AuthProvider>
                    <TeamProvider>
                        <BrowserRouter>
                            <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/tools" element={<ToolsPage />} />
                            <Route path="/tacticalmap" element={<TacticalMapPage />} />
                            <Route path="/data-analytics" element={<DataAnalyticsPage />} />
                            <Route path="/about" element={<AboutPage />} />
                            <Route path="/privacy" element={<PrivacyPage />} />
                            <Route path="/terms" element={<TermsPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />
                            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                            <Route path="/teams" element={<TeamsPage />} />
                            <Route path="/team-manager" element={<ProtectedRoute><TeamManagerPage /></ProtectedRoute>} />
                            <Route path="/scrim-scheduler" element={<ProtectedRoute><ScrimSchedulerPage /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
                            <Route path="/favorite-tools" element={<ProtectedRoute><FavoriteToolsPage /></ProtectedRoute>} />
                            <Route path="/auth/riot/callback" element={<RiotCallbackPage />} />
                            <Route path="*" element={<ErrorPage />} />
                        </Routes>
                    </BrowserRouter>
                </TeamProvider>
            </AuthProvider>
        </ToastProvider>
        </ErrorBoundary>
    );
}
