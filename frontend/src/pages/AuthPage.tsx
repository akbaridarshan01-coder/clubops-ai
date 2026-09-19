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
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-accent-violet/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div 
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-cyan p-0.5 shadow-glow flex items-center justify-center">
            <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent-cyan" />
            </div>
          </div>
          <div className="text-left">
            <span className="font-extrabold text-2xl tracking-tight text-white">CLUBOPS</span>
            <span className="text-xs font-semibold px-2 py-0.5 ml-1 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">
              AI
            </span>
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-background-card border border-border/80 shadow-2xl rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 animate-fade-in">
              {error}
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'LOGIN' ? (
            <div>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-white">Sign In to Command Center</h2>
                <p className="text-xs text-slate-400 mt-1">Access your club events and operations</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Continue to Dashboard</span>}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-400">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setMode('ONBOARDING');
                    setStep(1);
                  }}
                  className="text-primary-400 hover:underline font-semibold"
                >
                  Launch new event
                </button>
              </div>
            </div>
          ) : (
            /* MODE: ONBOARDING (5 STEPS) */
            <div>
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-6 border-b border-border/80 pb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="flex items-center space-x-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step === s 
                        ? 'bg-primary-600 text-white shadow-glow' 
                        : step > s 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-background-subtle text-slate-500 border border-border'
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
                    <h2 className="text-xl font-bold text-white">Welcome to ClubOps AI</h2>
                    <p className="text-xs text-slate-400 mt-1">Let's build your college event command center.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 text-left">
                    <div
                      onClick={() => {
                        setUserRoleChoice('ORGANIZER');
                        setStep(2);
                      }}
                      className="p-4 rounded-2xl border-2 border-primary-500/60 bg-primary-600/10 hover:bg-primary-600/20 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-primary-600/30 border border-primary-500/40 flex items-center justify-center text-primary-300">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-primary-300">
                            I'm an Event Organizer
                          </div>
                          <div className="text-xs text-slate-400">
                            Create club, scaffold events, and mobilize teams
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-primary-400 group-hover:translate-x-1 transition-transform" />
                    </div>

                    <div
                      onClick={() => {
                        setUserRoleChoice('JOINER');
                        setStep(2);
                      }}
                      className="p-4 rounded-2xl border border-border bg-background-subtle hover:bg-background-hover cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-background-hover border border-white/5 flex items-center justify-center text-slate-400">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">I'm Joining an Existing Club</div>
                          <div className="text-xs text-slate-400">
                            Join with a club code (e.g. TECH-2026)
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setMode('LOGIN')}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Already have an account? <span className="text-primary-400 font-semibold">Sign in</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: ACCOUNT CREATION */}
              {step === 2 && (
                <form onSubmit={handleAccountSubmit} className="space-y-4 animate-fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-white">Create Your Account</h2>
                    <p className="text-xs text-slate-400">Configure your organizer credentials and verification choice</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Verification Method Radio Choice */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Verification Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between text-xs transition-all ${
                        formData.verifyMethod === 'EMAIL'
                          ? 'border-primary-500 bg-primary-600/20 text-white shadow-glow'
                          : 'border-border bg-background-subtle text-slate-400 hover:border-slate-600'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="verifyMethod"
                            checked={formData.verifyMethod === 'EMAIL'}
                            onChange={() => setFormData({ ...formData, verifyMethod: 'EMAIL' })}
                            className="accent-primary-500"
                          />
                          <span className="font-semibold text-white">Email OTP</span>
                        </div>
                        <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Gmail SMTP Active</span>
                        </div>
                      </label>

                      <label className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between text-xs transition-all ${
                        formData.verifyMethod === 'MOBILE'
                          ? 'border-primary-500 bg-primary-600/20 text-white shadow-glow'
                          : 'border-border bg-background-subtle text-slate-400 hover:border-slate-600'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="verifyMethod"
                            checked={formData.verifyMethod === 'MOBILE'}
                            onChange={() => setFormData({ ...formData, verifyMethod: 'MOBILE' })}
                            className="accent-primary-500"
                          />
                          <span className="font-semibold text-white">Mobile OTP</span>
                        </div>
                        <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Fast2SMS Active 🇮🇳</span>
                        </div>
                      </label>
                    </div>

                    {formData.verifyMethod === 'MOBILE' && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 space-y-1">
                        <div className="font-semibold flex items-center space-x-1">
                          <span>⚠️ Fast2SMS Provider Requirement:</span>
                        </div>
                        <p className="text-slate-300">
                          Fast2SMS requires completing website verification (under <em>OTP Message</em>) or ₹100 initial recharge before their API activates.
                        </p>
                        <p className="text-amber-400 font-medium">
                          💡 Select <strong>Email OTP</strong> above to receive your verification code instantly & 100% free via Gmail!
                        </p>
                      </div>
                    )}
                  </div>




                  <div className="pt-3 flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-border text-slate-400 text-xs font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all flex items-center justify-center space-x-2"
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
                    <div className="w-12 h-12 rounded-2xl bg-primary-500/20 border border-primary-500/40 text-primary-400 mx-auto flex items-center justify-center mb-3">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Enter 6-Digit Verification Code</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Sent to <strong className="text-slate-200">{formData.verifyMethod === 'MOBILE' ? formData.mobile : formData.email}</strong>
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
                        className="w-11 h-12 text-center text-lg font-bold bg-background-subtle border border-border focus:border-primary-500 rounded-xl text-white focus:outline-none shadow-sm"
                      />
                    ))}
                  </div>

                  <div className="text-xs text-center">
                    {cooldown > 0 ? (
                      <div className="text-slate-400 flex items-center justify-center space-x-2">
                        <span>Resend code available in:</span>
                        <span className="font-mono text-primary-400 font-bold bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">{cooldown}s</span>
                      </div>
                    ) : (
                      <div className="text-slate-400">
                        Didn't receive code?{' '}
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleResendOtp}
                          className="text-primary-400 font-semibold hover:underline cursor-pointer disabled:opacity-50"
                        >
                          Resend OTP
                        </button>
                      </div>
                    )}
                  </div>


                  <div className="flex items-center justify-start text-xs pt-1">
                    <button onClick={() => setStep(2)} className="text-slate-400 hover:text-white">
                      Change {formData.verifyMethod.toLowerCase()}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.join('').length < 6}
                    className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify & Continue</span>}
                  </button>
                </div>
              )}

              {/* STEP 4: CREATE CLUB ONBOARDING */}
              {step === 4 && (
                <form onSubmit={handleCreateClub} className="space-y-4 animate-fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-white">Create Your Club Command</h2>
                    <p className="text-xs text-slate-400">Establish your organization's multi-tenant workspace</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Club Name</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={clubData.name}
                        onChange={(e) => setClubData({ ...clubData, name: e.target.value })}
                        className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">College / University</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={clubData.college}
                        onChange={(e) => setClubData({ ...clubData, college: e.target.value })}
                        className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                    <select
                      value={clubData.category}
                      onChange={(e) => setClubData({ ...clubData, category: e.target.value })}
                      className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
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
                    <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={clubData.description}
                      onChange={(e) => setClubData({ ...clubData, description: e.target.value })}
                      className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all flex items-center justify-center space-x-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Club & Proceed</span>}
                  </button>
                </form>
              )}

              {/* STEP 5: EVENT ORGANIZER ONBOARDING & AI SCAFFOLD */}
              {step === 5 && (
                <form onSubmit={handleCreateEvent} className="space-y-4 animate-fade-in">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 text-[10px] font-mono mb-2">
                      <Sparkles className="w-3 h-3" />
                      <span>AI WORKSPACE GENERATOR</span>
                    </div>
                    <h2 className="text-lg font-bold text-white">What are you organizing?</h2>
                    <p className="text-xs text-slate-400">AI will automatically construct workstreams, critical dependencies, and initial milestones.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Event Name</label>
                      <input
                        type="text"
                        required
                        value={eventData.name}
                        onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                        className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Event Type</label>
                      <select
                        value={eventData.type}
                        onChange={(e) => setEventData({ ...eventData, type: e.target.value })}
                        className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
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
                      <label className="block text-xs font-medium text-slate-300 mb-1">Target Date</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={eventData.date}
                        onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                        className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Expected Attendees</label>
                      <input
                        type="text"
                        placeholder="e.g. 500"
                        value={eventData.expectedParticipants}
                        onChange={(e) => setEventData({ ...eventData, expectedParticipants: e.target.value })}
                        className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Location / Venue</label>
                    <input
                      type="text"
                      required
                      value={eventData.location}
                      onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                      className="w-full bg-background-subtle border border-border focus:border-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-primary-900/20 border border-primary-500/30 text-xs text-primary-200">
                    <div className="font-semibold flex items-center space-x-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
                      <span>AI Scaffolding Preview:</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      AI will automatically suggest 6 operational teams (Logistics, AV, Tech, Sponsors, Marketing, Hospitality), 5 initial critical path tasks, and preliminary risk alerts for your review.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-glow transition-all flex items-center justify-center space-x-2"
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
