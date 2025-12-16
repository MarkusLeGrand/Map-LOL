import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/site/HomePage';
import ToolsPage from './pages/site/ToolsPage';
import TacticalMapPage from './pages/tactical-map/TacticalMapPage';
import AboutPage from './pages/site/AboutPage';
import DataAnalyticsPage from './pages/site/DataAnalyticsPage';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/tacticalmap" element={<TacticalMapPage />} />
                <Route path="/data-analytics" element={<DataAnalyticsPage />} />
                <Route path="/about" element={<AboutPage />} />
            </Routes>
        </BrowserRouter>
    );
}
