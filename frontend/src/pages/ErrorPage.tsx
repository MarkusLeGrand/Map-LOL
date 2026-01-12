import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header />

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="text-8xl font-bold text-[#B4975A] mb-4">404</div>
            <h1 className="text-3xl font-bold text-[#F5F5F5] mb-2">Page Not Found</h1>
            <p className="text-[#F5F5F5]/60">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-[#B4975A] text-[#0E0E0E] font-semibold rounded hover:bg-[#B4975A]/90 transition-colors"
            >
              Go Home
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full px-6 py-3 border border-[#F5F5F5]/20 text-[#F5F5F5] font-semibold rounded hover:bg-[#F5F5F5]/5 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
