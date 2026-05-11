import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, getDashboardPath } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';
import { ShieldCheck, Mail, Lock, Phone, User, Eye, EyeOff, Loader2, ArrowRight, Building2, Home, Users, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type RoleType = 'owner' | 'tenant' | 'owner-resident';

const roleOptions: { value: RoleType; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: 'owner',
    label: 'I am an Owner',
    description: 'I own a flat but don\'t live here',
    icon: Building2,
  },
  {
    value: 'tenant',
    label: 'I am a Tenant',
    description: 'I am renting a flat',
    icon: Users,
  },
  {
    value: 'owner-resident',
    label: 'Owner & Resident',
    description: 'I own the flat and live here',
    icon: Home,
  },
];

export default function SignUp() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedApartment, setSelectedApartment] = useState('');

  const { signUp, isLoading } = useAuthStore();
  const { apartments } = useAppStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get unique blocks
  const blocks = [...new Set(apartments.map(a => a.block))].sort();
  
  // Get apartments for selected block
  const blockApartments = apartments.filter(a => a.block === selectedBlock);

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedRole) {
      toast({
        title: 'Select your role',
        description: 'Please select how you are associated with the apartment',
        variant: 'destructive',
      });
      return;
    }
    
    if (step === 2) {
      if (!name || !email || !phone) {
        toast({
          title: 'Missing information',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
    }
    
    if (step === 3) {
      if (!password || password.length < 6) {
        toast({
          title: 'Invalid password',
          description: 'Password must be at least 6 characters',
          variant: 'destructive',
        });
        return;
      }
      if (password !== confirmPassword) {
        toast({
          title: 'Passwords don\'t match',
          description: 'Please make sure your passwords match',
          variant: 'destructive',
        });
        return;
      }
    }
    
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole || !selectedApartment) {
      toast({
        title: 'Missing information',
        description: 'Please select your apartment',
        variant: 'destructive',
      });
      return;
    }

    const success = await signUp({
      name,
      email,
      phone,
      password,
      role: selectedRole,
      apartmentId: selectedApartment,
    });

    if (success) {
      const user = useAuthStore.getState().user;
      const dashboardPath = user ? getDashboardPath(user.role) : '/';
      toast({
        title: 'Account created!',
        description: `Welcome to ApartmentOS, ${name}!`,
      });
      navigate(dashboardPath, { replace: true });
    } else {
      toast({
        title: 'Sign up failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
      
      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-[Outfit]">ApartmentOS</h1>
          <p className="text-slate-400 mt-2">Create your account</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  s < step
                    ? 'bg-green-500 text-white'
                    : s === step
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/10 text-slate-500'
                }`}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-0.5 mx-1 transition-all ${
                    s < step ? 'bg-green-500' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Sign Up Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-white mb-2">How are you associated?</h2>
                <p className="text-slate-400 text-sm">Select your relationship with the apartment</p>
              </div>

              <div className="space-y-3">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedRole === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleRoleSelect(option.value)}
                      className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-indigo-500' : 'bg-white/10'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {option.label}
                        </p>
                        <p className="text-sm text-slate-500">{option.description}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Role Info */}
              {selectedRole && (
                <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <p className="text-sm text-indigo-300">
                    {selectedRole === 'owner' && (
                      <>As an <strong>Owner</strong>, you can view property details, manage tenants, and track payments.</>
                    )}
                    {selectedRole === 'tenant' && (
                      <>As a <strong>Tenant</strong>, you can invite visitors, register workers, and raise complaints.</>
                    )}
                    {selectedRole === 'owner-resident' && (
                      <>As an <strong>Owner-Resident</strong>, you get all features of both owner and tenant - full access to manage your property and daily operations.</>
                    )}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleNextStep}
                disabled={!selectedRole}
                className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-white mb-2">Personal Information</h2>
                <p className="text-slate-400 text-sm">Tell us about yourself</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all border border-white/10"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Password */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-white mb-2">Create Password</h2>
                <p className="text-slate-400 text-sm">Secure your account</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all border border-white/10"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Apartment Selection */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-white mb-2">Select Your Apartment</h2>
                <p className="text-slate-400 text-sm">Choose your block and flat</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Block</label>
                <select
                  value={selectedBlock}
                  onChange={(e) => { setSelectedBlock(e.target.value); setSelectedApartment(''); }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="" className="bg-slate-800">Select Block</option>
                  {blocks.map((block) => (
                    <option key={block} value={block} className="bg-slate-800">
                      Block {block}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBlock && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Apartment</label>
                  <select
                    value={selectedApartment}
                    onChange={(e) => setSelectedApartment(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="" className="bg-slate-800">Select Apartment</option>
                    {blockApartments.map((apt) => (
                      <option key={apt.id} value={apt.id} className="bg-slate-800">
                        {apt.unitNo} - {apt.type} (Floor {apt.floor}) {apt.status === 'Occupied' ? '• Occupied' : '• Vacant'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Summary */}
              {selectedApartment && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm font-medium text-slate-300 mb-2">Account Summary</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-400">Name: <span className="text-white">{name}</span></p>
                    <p className="text-slate-400">Email: <span className="text-white">{email}</span></p>
                    <p className="text-slate-400">Role: <span className="text-indigo-400 capitalize">{selectedRole?.replace('-', ' ')}</span></p>
                    <p className="text-slate-400">Apartment: <span className="text-white">{blockApartments.find(a => a.id === selectedApartment)?.unitNo}</span></p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all border border-white/10"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !selectedApartment}
                  className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-slate-500">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10"
          >
            Sign In Instead
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          © 2026 ApartmentOS. All rights reserved.
        </p>
      </div>
    </div>
  );
}