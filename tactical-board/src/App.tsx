import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/site/HomePage';
import ToolsPage from './pages/site/ToolsPage';
import TacticalMapPage from './pages/tactical-map/TacticalMapPage';
import AboutPage from './pages/site/AboutPage';
import DataAnalyticsPage from './pages/site/DataAnalyticsPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardPage from './pages/auth/DashboardPage';
import TeamManagementPage from './pages/auth/TeamManagementPage';
import ProfilePage from './pages/auth/ProfilePage';
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
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/teams" element={<TeamManagementPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                        </Routes>
                    </BrowserRouter>
                </TeamProvider>
            </AuthProvider>
        </ToastProvider>
    );
}
