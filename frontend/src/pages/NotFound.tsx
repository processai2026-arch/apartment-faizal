import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-5xl font-bold font-[Outfit] text-slate-900 mb-4">404</h1>
        <p className="text-lg font-medium text-slate-700 mb-2">Page Not Found</p>
        <p className="text-slate-400 text-sm mb-8">The page at <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{location.pathname}</code> doesn't exist.</p>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors mx-auto">
          <Home className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;
