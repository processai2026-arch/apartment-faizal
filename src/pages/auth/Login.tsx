import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, getDashboardPath } from '@/stores/useAuthStore';
import { ShieldCheck, Mail, Lock, Phone, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Login() {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  const { login, loginWithOTP, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fillCredentials = (cEmail: string, cPassword: string) => {
    setLoginMethod('email');
    setEmail(cEmail);
    setPassword(cPassword);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login({ email, password });
    
    if (success) {
      const user = useAuthStore.getState().user;
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${user?.name}`,
      });
      navigate(getDashboardPath(user!.role));
    } else {
      toast({
        title: 'Login failed',
        description: 'Invalid email or password',
        variant: 'destructive',
      });
    }
  };

  const handleSendOTP = async () => {
    if (!phone) {
      toast({
        title: 'Phone required',
        description: 'Please enter your phone number',
        variant: 'destructive',
      });
      return;
    }
    
    // Simulate OTP sending
    setOtpSent(true);
    toast({
      title: 'OTP Sent',
      description: 'A 6-digit OTP has been sent to your phone',
    });
  };

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await loginWithOTP(phone, otp);
    
    if (success) {
      const user = useAuthStore.getState().user;
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${user?.name}`,
      });
      navigate(getDashboardPath(user!.role));
    } else {
      toast({
        title: 'Login failed',
        description: 'Invalid OTP',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-2xl font-[Outfit]">OfficeGate</span>
        </div>
        
        {/* Content */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white font-[Outfit] leading-tight">
            Smart Office<br />Visitor Management
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Streamline visitor management, security operations, and vehicle tracking for your office building.
          </p>
          
          {/* Features */}
          <div className="space-y-4 pt-6">
            {[
              'Digital visitor verification with OTP & QR',
              'Real-time security monitoring',
              'Staff attendance & inventory tracking',
              'Financial management & reporting',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="relative z-10 text-slate-500 text-sm">
          © 2026 OfficeGate. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl font-[Outfit]">OfficeGate</span>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 font-[Outfit]">Welcome Back</h2>
              <p className="text-slate-500 mt-2">Sign in to your account</p>
            </div>

            {/* Login Method Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
              <button
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  loginMethod === 'email'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  loginMethod === 'phone'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Phone OTP
              </button>
            </div>

            {loginMethod === 'email' ? (
              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-600">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOTPLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-center text-lg tracking-widest"
                      required
                    />
                  </div>
                )}

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Send OTP
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Verify & Sign In
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </form>
            )}

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Demo Credentials — click to auto-fill</p>
              <div className="space-y-2 text-sm">
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@officegate.com', 'admin123')}
                  className="w-full flex items-center justify-between p-2 bg-white rounded-lg hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all cursor-pointer text-left"
                >
                  <div>
                    <span className="font-medium text-slate-900">Admin</span>
                    <p className="text-xs text-slate-500">Full system access</p>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <p>admin@officegate.com</p>
                    <p>admin123</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('security@officegate.com', 'security123')}
                  className="w-full flex items-center justify-between p-2 bg-white rounded-lg hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all cursor-pointer text-left"
                >
                  <div>
                    <span className="font-medium text-slate-900">Security</span>
                    <p className="text-xs text-slate-500">Gate operations</p>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <p>security@officegate.com</p>
                    <p>security123</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('tenant@officegate.com', 'tenant123')}
                  className="w-full flex items-center justify-between p-2 bg-white rounded-lg border-2 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer text-left"
                >
                  <div>
                    <span className="font-medium text-indigo-600">Tenant / Owner</span>
                    <p className="text-xs text-slate-500">Visitor approvals, payments</p>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <p>tenant@officegate.com</p>
                    <p>tenant123</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}