import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Mail, 
  Phone, 
  Lock, 
  User as UserIcon, 
  Building2, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Loader2,
  ChevronLeft,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useEvent } from '../context/EventContext.js';
import { api } from '../services/api.js';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'login' ? 'LOGIN' : 'ONBOARDING';

  const [mode, setMode] = useState<'LOGIN' | 'ONBOARDING'>(initialMode);
  const [step, setStep] = useState(1); // 1: Welcome Choice, 2: Account Details, 3: OTP Verify, 4: Create Club, 5: Create Event
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, verifyOtpAndLogin, register } = useAuth();
  const { refreshClubsAndEvents } = useEvent();
  const navigate = useNavigate();

  // Onboarding Form States
  const [userRoleChoice, setUserRoleChoice] = useState<'ORGANIZER' | 'JOINER'>('ORGANIZER');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    verifyMethod: 'EMAIL' as 'EMAIL' | 'MOBILE',
  });

  // 6-box OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const startCooldown = (expiresAt: number) => {
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    const tick = () => {
      const rem = Math.ceil((expiresAt - Date.now()) / 1000);
      if (rem <= 0) { setCooldown(0); clearInterval(cooldownTimerRef.current!); }
      else setCooldown(rem);
    };
    tick();
    cooldownTimerRef.current = setInterval(tick, 1000);
  };

  useEffect(() => () => { if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current); }, []);

  // Club details
  const [clubData, setClubData] = useState({
    name: '',
    college: '',
    category: 'Technical',
    description: '',
  });
  const [createdClub, setCreatedClub] = useState<any>(null);

  // Event details
  const [eventData, setEventData] = useState({
    name: '',
    type: 'Hackathon',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expectedParticipants: '',
    location: '',
    budget: '',
  });

  // Login Form State
  const [loginMethod, setLoginMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');


  // Handle 6-box OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);

    // Auto-advance
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Step 2: Submit Registration & Request OTP
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result: any = await register({
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        verifyMethod: formData.verifyMethod,
      });
      if (result?.otpResult?.cooldownExpiresAt) startCooldown(result.otpResult.cooldownExpiresAt);
      setOtp(['', '', '', '', '', '']);
      setStep(3); // Go to OTP verification
    } catch (err: any) {
      // If user already exists in demo, allow directly proceeding to verification or login
      if (err.message?.includes('already exists')) {
        setOtp(['', '', '', '', '', '']);
        setStep(3);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOtp = async () => {
    setError(null);
    setLoading(true);
    const code = otp.join('');
    const targetIdentifier = formData.verifyMethod === 'MOBILE' ? formData.mobile : formData.email;

    try {
      await verifyOtpAndLogin(targetIdentifier, code, formData.verifyMethod === 'MOBILE' ? 'MOBILE_VERIFY' : 'EMAIL_VERIFY');
      setStep(4); // Go to Club Creation
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const targetIdentifier = formData.verifyMethod === 'MOBILE' ? formData.mobile : formData.email;
      const otpType = formData.verifyMethod === 'MOBILE' ? 'MOBILE_VERIFY' : 'EMAIL_VERIFY';
      const res: any = await api.sendLoginOtp(targetIdentifier);
      if (res?.cooldownExpiresAt) startCooldown(res.cooldownExpiresAt);
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };


  // Step 4: Create Club
  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const club: any = await api.createClub(clubData);
      setCreatedClub(club);
      setStep(5); // Go to Event Onboarding
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Create Event & AI Scaffold
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.createEvent({
        clubId: createdClub?.id || (await api.getMyClubs() as any[])[0]?.id,
        ...eventData,
        expectedParticipants: Number(eventData.expectedParticipants) || 500,
        budget: Number(eventData.budget) || 0,
      });
      await refreshClubsAndEvents();
      navigate('/mission-control');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Standard Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      await refreshClubsAndEvents();
      navigate('/mission-control');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div 
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#EDE9FE] border border-purple-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div className="text-left">
            <span className="font-extrabold text-2xl tracking-tight text-[#191E35]">MeetCraft</span>
            <span className="text-xs font-semibold px-2 py-0.5 ml-1.5 rounded-full bg-[#EDE9FE] text-[#7C3AED]">
              AI
            </span>
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white border border-[#EAEFF7] shadow-card rounded-3xl p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 animate-fade-in font-medium">
              {error}
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'LOGIN' ? (
            <div>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-[#191E35]">Sign In to Command Center</h2>
                <p className="text-xs text-[#7A829D] mt-1 font-medium">Access your club events and operations</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#191E35] mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#7A829D] absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#191E35] placeholder-[#7A829D] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#191E35] mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#7A829D] absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#191E35] placeholder-[#7A829D] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Continue to Dashboard</span>}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-[#7A829D]">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setMode('ONBOARDING');
                    setStep(1);
                  }}
                  className="text-[#7C3AED] hover:underline font-semibold"
                >
                  Launch new event
                </button>
              </div>
            </div>
          ) : (
            /* MODE: ONBOARDING (5 STEPS) */
            <div>
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-6 border-b border-[#EAEFF7] pb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="flex items-center space-x-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step === s 
                        ? 'bg-[#8B5CF6] text-white shadow-sm' 
                        : step > s 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-[#F4F5FB] text-[#7A829D] border border-[#EAEFF7]'
                    }`}>
                      {step > s ? '✓' : s}
                    </div>
                  </div>
                ))}
              </div>

              {/* STEP 1: WELCOME */}
              {step === 1 && (
                <div className="space-y-6 text-center animate-fade-in">
                  <div>
                    <h2 className="text-xl font-bold text-[#191E35]">Welcome to MeetCraft</h2>
                    <p className="text-xs text-[#7A829D] mt-1 font-medium">Let's build your college event command center.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 text-left">
                    <div
                      onClick={() => {
                        setUserRoleChoice('ORGANIZER');
                        setStep(2);
                      }}
                      className="p-4 rounded-2xl border-2 border-purple-200 bg-[#EDE9FE]/30 hover:bg-[#EDE9FE]/60 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white border border-purple-200 flex items-center justify-center text-[#7C3AED] shadow-sm">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#191E35] group-hover:text-[#7C3AED] transition-colors">
                            I'm an Event Organizer
                          </div>
                          <div className="text-xs text-[#7A829D]">
                            Create club, scaffold events, and mobilize teams
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#8B5CF6] group-hover:translate-x-1 transition-transform" />
                    </div>

                    <div
                      onClick={() => {
                        setUserRoleChoice('JOINER');
                        setStep(2);
                      }}
                      className="p-4 rounded-2xl border border-[#EAEFF7] bg-white hover:bg-[#F4F5FB] cursor-pointer transition-all flex items-center justify-between group shadow-card"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#F4F5FB] border border-[#EAEFF7] flex items-center justify-center text-[#7A829D]">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#191E35]">I'm Joining an Existing Club</div>
                          <div className="text-xs text-[#7A829D]">
                            Join with a club code (e.g. TECH-2026)
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#7A829D] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setMode('LOGIN')}
                      className="text-xs text-[#7A829D] hover:text-[#191E35] transition-colors font-medium"
                    >
                      Already have an account? <span className="text-[#7C3AED] font-semibold">Sign in</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: ACCOUNT CREATION */}
              {step === 2 && (
                <form onSubmit={handleAccountSubmit} className="space-y-4 animate-fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-[#191E35]">Create Your Account</h2>
                    <p className="text-xs text-[#7A829D] font-medium">Configure your organizer credentials and verification choice</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#191E35] mb-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-[#7A829D] absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#191E35] placeholder-[#7A829D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#191E35] mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#7A829D] absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#191E35] placeholder-[#7A829D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#191E35] mb-1">Mobile Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#7A829D] absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#191E35] placeholder-[#7A829D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#191E35] mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#7A829D] absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#191E35] placeholder-[#7A829D] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Verification Method Radio Choice */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-[#191E35] mb-2">Verification Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`p-3 rounded-2xl border cursor-pointer flex flex-col justify-between text-xs transition-all ${
                        formData.verifyMethod === 'EMAIL'
                          ? 'border-[#8B5CF6] bg-[#EDE9FE]/40 text-[#191E35] shadow-sm'
                          : 'border-[#EAEFF7] bg-[#F4F5FB] text-[#7A829D] hover:border-purple-200'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="verifyMethod"
                            checked={formData.verifyMethod === 'EMAIL'}
                            onChange={() => setFormData({ ...formData, verifyMethod: 'EMAIL' })}
                            className="accent-[#8B5CF6]"
                          />
                          <span className="font-semibold text-[#191E35]">Email OTP</span>
                        </div>
                        <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-emerald-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Gmail SMTP Active</span>
                        </div>
                      </label>

                      <label className={`p-3 rounded-2xl border cursor-pointer flex flex-col justify-between text-xs transition-all ${
                        formData.verifyMethod === 'MOBILE'
                          ? 'border-[#8B5CF6] bg-[#EDE9FE]/40 text-[#191E35] shadow-sm'
                          : 'border-[#EAEFF7] bg-[#F4F5FB] text-[#7A829D] hover:border-purple-200'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="verifyMethod"
                            checked={formData.verifyMethod === 'MOBILE'}
                            onChange={() => setFormData({ ...formData, verifyMethod: 'MOBILE' })}
                            className="accent-[#8B5CF6]"
                          />
                          <span className="font-semibold text-[#191E35]">Mobile OTP</span>
                        </div>
                        <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-emerald-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Fast2SMS Active 🇮🇳</span>
                        </div>
                      </label>
                    </div>

                    {formData.verifyMethod === 'MOBILE' && (
                      <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1 font-medium">
                        <div className="font-semibold flex items-center space-x-1">
                          <span>⚠️ Fast2SMS Provider Requirement:</span>
                        </div>
                        <p className="text-[#191E35]">
                          Fast2SMS requires completing website verification (under <em>OTP Message</em>) or ₹100 initial recharge before their API activates.
                        </p>
                        <p className="text-amber-700 font-semibold">
                          💡 Select <strong>Email OTP</strong> above to receive your verification code instantly & 100% free via Gmail!
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-[#EAEFF7] bg-white text-[#7A829D] hover:text-[#191E35] text-xs font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Continue to Verification</span>}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: OTP VERIFICATION */}
              {step === 3 && (
                <div className="space-y-6 text-center animate-fade-in">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] mx-auto flex items-center justify-center mb-3 shadow-sm">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-[#191E35]">Enter 6-Digit Verification Code</h2>
                    <p className="text-xs text-[#7A829D] mt-1 font-medium">
                      Sent to <strong className="text-[#191E35]">{formData.verifyMethod === 'MOBILE' ? formData.mobile : formData.email}</strong>
                    </p>
                  </div>

                  {/* 6 OTP Input Boxes */}
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        className="w-11 h-12 text-center text-lg font-bold bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl text-[#191E35] focus:outline-none shadow-sm"
                      />
                    ))}
                  </div>

                  <div className="text-xs text-center">
                    {cooldown > 0 ? (
                      <div className="text-[#7A829D] flex items-center justify-center space-x-2">
                        <span>Resend code available in:</span>
                        <span className="font-mono text-[#7C3AED] font-bold bg-[#EDE9FE] px-2 py-0.5 rounded-full">{cooldown}s</span>
                      </div>
                    ) : (
                      <div className="text-[#7A829D]">
                        Didn't receive code?{' '}
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleResendOtp}
                          className="text-[#7C3AED] font-semibold hover:underline cursor-pointer disabled:opacity-50"
                        >
                          Resend OTP
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-start text-xs pt-1">
                    <button onClick={() => setStep(2)} className="text-[#7A829D] hover:text-[#191E35] font-medium">
                      Change {formData.verifyMethod.toLowerCase()}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.join('').length < 6}
                    className="w-full py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify & Continue</span>}
                  </button>
                </div>
              )}

              {/* STEP 4: CREATE CLUB ONBOARDING */}
              {step === 4 && (
                <form onSubmit={handleCreateClub} className="space-y-4 animate-fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-[#191E35]">Create Your Club Command</h2>
                    <p className="text-xs text-[#7A829D] font-medium">Establish your organization's multi-tenant workspace</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#191E35] mb-1">Club Name</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-[#7A829D] absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={clubData.name}
                        onChange={(e) => setClubData({ ...clubData, name: e.target.value })}
                        className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#191E35] placeholder-[#7A829D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#191E35] mb-1">College / University</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-[#7A829D] absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={clubData.college}
                        onChange={(e) => setClubData({ ...clubData, college: e.target.value })}
                        className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#191E35] placeholder-[#7A829D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#191E35] mb-1">Category</label>
                    <select
                      value={clubData.category}
                      onChange={(e) => setClubData({ ...clubData, category: e.target.value })}
                      className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-[#191E35] focus:outline-none"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Sports">Sports</option>
                      <option value="Literary">Literary</option>
                      <option value="Entrepreneurship">Entrepreneurship</option>
                      <option value="Social">Social</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#191E35] mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={clubData.description}
                      onChange={(e) => setClubData({ ...clubData, description: e.target.value })}
                      className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-[#191E35] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Club & Proceed</span>}
                  </button>
                </form>
              )}

              {/* STEP 5: EVENT ORGANIZER ONBOARDING & AI SCAFFOLD */}
              {step === 5 && (
                <form onSubmit={handleCreateEvent} className="space-y-4 animate-fade-in">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] text-[10px] font-bold mb-2">
                      <Sparkles className="w-3 h-3" />
                      <span>AI WORKSPACE GENERATOR</span>
                    </div>
                    <h2 className="text-lg font-bold text-[#191E35]">What are you organizing?</h2>
                    <p className="text-xs text-[#7A829D] font-medium">AI will automatically construct workstreams, critical dependencies, and initial milestones.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#191E35] mb-1">Event Name</label>
                      <input
                        type="text"
                        required
                        value={eventData.name}
                        onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                        className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-[#191E35] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#191E35] mb-1">Event Type</label>
                      <select
                        value={eventData.type}
                        onChange={(e) => setEventData({ ...eventData, type: e.target.value })}
                        className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl px-3 py-2.5 text-xs text-[#191E35] focus:outline-none"
                      >
                        <option value="Hackathon">Hackathon</option>
                        <option value="Tech Fest">Tech Fest</option>
                        <option value="Cultural Fest">Cultural Fest</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Sports Event">Sports Event</option>
                        <option value="Competition">Competition</option>
                        <option value="Conference">Conference</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#191E35] mb-1">Target Date</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={eventData.date}
                        onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                        className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-[#191E35] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#191E35] mb-1">Expected Attendees</label>
                      <input
                        type="text"
                        placeholder="e.g. 500"
                        value={eventData.expectedParticipants}
                        onChange={(e) => setEventData({ ...eventData, expectedParticipants: e.target.value })}
                        className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-[#191E35] placeholder-[#7A829D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#191E35] mb-1">Location / Venue</label>
                    <input
                      type="text"
                      required
                      value={eventData.location}
                      onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                      className="w-full bg-[#F4F5FB] border border-[#EAEFF7] focus:border-[#8B5CF6] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-[#191E35] focus:outline-none"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F5F3FF] border border-purple-200 text-xs text-[#191E35]">
                    <div className="font-semibold flex items-center space-x-1.5 mb-1 text-[#7C3AED]">
                      <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      <span>AI Scaffolding Preview:</span>
                    </div>
                    <p className="text-[11px] text-[#7A829D] leading-relaxed font-medium">
                      AI will automatically suggest 6 operational teams (Logistics, AV, Tech, Sponsors, Marketing, Hospitality), 5 initial critical path tasks, and preliminary risk alerts for your review.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Launch Event Mission Control</span>}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
