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
import AdminPage from './pages/auth/AdminPage';
import { AuthProvider } from './contexts/AuthContext';
import { TeamProvider } from './contexts/TeamContext';
import { ToastProvider } from './contexts/ToastContext';

export default function App() {
    return (
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
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/teams" element={<TeamsPage />} />
                            <Route path="/team-manager" element={<TeamManagerPage />} />
                            <Route path="/scrim-scheduler" element={<ScrimSchedulerPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/admin" element={<AdminPage />} />
                        </Routes>
                    </BrowserRouter>
                </TeamProvider>
            </AuthProvider>
        </ToastProvider>
    );
}
