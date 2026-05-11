import { useState, useEffect } from 'react';
import { QrCode, UserPlus, LogOut, Car, CarFront, Copy, Check, ExternalLink, Smartphone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface QREntry {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const qrItems: QREntry[] = [
  {
    id: 'visitor-entry',
    title: 'Visitor Check-In',
    description: 'Visitors scan this to self-register at the gate. Their data reflects instantly in the admin dashboard.',
    path: '/scan/visitor-entry',
    icon: UserPlus,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  {
    id: 'visitor-checkout',
    title: 'Visitor Check-Out',
    description: 'Visitors scan this when leaving. They find their name and tap Exit to log departure time.',
    path: '/scan/visitor-checkout',
    icon: LogOut,
    color: 'text-slate-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
  },
  {
    id: 'vehicle-entry',
    title: 'Vehicle Entry',
    description: 'Drivers scan this to log their vehicle at the gate. Registration is instant and searchable.',
    path: '/scan/vehicle-entry',
    icon: Car,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
  },
  {
    id: 'vehicle-checkout',
    title: 'Vehicle Exit',
    description: 'Drivers scan this when exiting. Find the vehicle number and tap Exit to record departure.',
    path: '/scan/vehicle-checkout',
    icon: CarFront,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
];

function QRCodeCanvas({ url, size = 160 }: { url: string; size?: number }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR using the free QR API (no library needed)
    const encoded = encodeURIComponent(url);
    setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=ffffff&color=0f172a&qzone=1&format=png`);
  }, [url, size]);

  if (!qrDataUrl) return <div className="w-40 h-40 bg-slate-100 rounded-xl animate-pulse" />;

  return (
    <img
      src={qrDataUrl}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-xl border border-slate-200"
    />
  );
}

export default function QRCodesPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const copyUrl = async (item: QREntry) => {
    const url = `${baseUrl}${item.path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(item.id);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const openScanPage = (path: string) => {
    window.open(`${baseUrl}${path}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold font-[Outfit] text-lg">Self-Service QR Check-In System</h2>
            <p className="text-indigo-100 text-sm mt-1 leading-relaxed">
              Print or display these QR codes at the gate. When visitors or drivers scan them with a smartphone, 
              they fill a mobile-friendly form. All submissions instantly appear in the admin dashboard in real-time.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-xs">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Real-time sync
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-xs">
            <Smartphone className="w-3 h-3" />
            Mobile optimized
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-xs">
            <RefreshCw className="w-3 h-3" />
            No app required
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold font-[Outfit] text-base mb-4">How it works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Display QR', desc: 'Print or show QR code at gate/entrance' },
            { step: '2', title: 'User Scans', desc: 'Visitor uses phone camera to scan the code' },
            { step: '3', title: 'Fill Form', desc: 'Mobile-friendly form opens in their browser' },
            { step: '4', title: 'Instant Sync', desc: 'Data appears live in admin dashboard' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-7 h-7 bg-indigo-600 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {qrItems.map((item) => {
          const Icon = item.icon;
          const fullUrl = `${baseUrl}${item.path}`;
          return (
            <div key={item.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${item.borderColor}`}>
              {/* Card Header */}
              <div className={`${item.bgColor} px-5 py-4 flex items-center gap-3 border-b ${item.borderColor}`}>
                <div className={`w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div>
                  <h3 className={`font-semibold font-[Outfit] text-sm ${item.color}`}>{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                </div>
              </div>

              {/* QR + Actions */}
              <div className="p-5 flex flex-col sm:flex-row items-center gap-5">
                {/* QR Code */}
                <div className="flex-shrink-0">
                  <QRCodeCanvas url={fullUrl} size={160} />
                  <p className="text-center text-xs text-slate-400 mt-2">Scan to test</p>
                </div>

                {/* URL + Actions */}
                <div className="flex-1 w-full space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Page URL</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-700 break-all leading-relaxed">
                      {fullUrl}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => copyUrl(item)}
                      className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <><Check className="w-4 h-4 text-green-500" />Copied!</>
                      ) : (
                        <><Copy className="w-4 h-4" />Copy Link</>
                      )}
                    </button>
                    <button
                      onClick={() => openScanPage(item.path)}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors text-white ${item.id === 'visitor-entry' ? 'bg-indigo-600 hover:bg-indigo-700' : item.id === 'vehicle-entry' ? 'bg-violet-600 hover:bg-violet-700' : item.id === 'vehicle-checkout' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-700 hover:bg-slate-800'}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Form Page
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                    <span className="text-xs text-green-700 font-medium">Live — submissions appear instantly in dashboard</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Print Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <QrCode className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Placement Tips for Best Results</p>
            <ul className="text-xs text-amber-700 mt-1.5 space-y-1 leading-relaxed">
              <li>• Print the QR code at least 10cm × 10cm for easy scanning from a distance</li>
              <li>• Place Visitor Check-In QR at the gate entrance, clearly visible</li>
              <li>• Place Vehicle Entry QR near the barrier or parking entry</li>
              <li>• Laminate printouts to protect from weather outdoors</li>
              <li>• For digital screens (tablets at reception), use the "Open Form Page" button</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
