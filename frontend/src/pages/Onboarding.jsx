import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import LanguageToggle from '../components/ui/LanguageToggle';
import { UserCheck, Sprout, ArrowRight, Lock } from 'lucide-react';

const Onboarding = () => {
  const {
    loginStep,
    loginStepOne,
    loginStepTwo,
    adminLogin,
    register,
    setLoginStep,
    setPendingCredentials
  } = useAuth();

  const { t } = useLanguage();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'admin'
  const [role, setRole] = useState('buyer'); // 'buyer' | 'supplier'

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');

  const [userIdInput, setUserIdInput] = useState('');
  const [gstInput, setGstInput] = useState('');
  const [otpInput, setOtpInput] = useState('');

  // Status logs
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [loading, setLoading] = useState(false);

  const triggerToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await register({
        email,
        password,
        role,
        companyName,
        gstNumber,
        contactNumber,
        address,
      });
      triggerToast(data.message, 'success');
      setEmail('');
      setPassword('');
      setCompanyName('');
      setGstNumber('');
      setContactNumber('');
      setAddress('');
      setTimeout(() => setMode('login'), 2500);
    } catch (err) {
      const msg = typeof err === 'string' ? err : err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
      triggerToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginInit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginStepOne(userIdInput, gstInput);
      triggerToast('OTP passcode dispatched to your email!', 'info');
    } catch (err) {
      setError(err);
      triggerToast(err, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginStepTwo(otpInput);
      triggerToast('Authentication successful!', 'success');
    } catch (err) {
      setError(err);
      triggerToast(err, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(email, password);
      triggerToast('Authenticated as Platform Administrator', 'success');
    } catch (err) {
      setError(err);
      triggerToast(err, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setError('');
    setLoginStep(1);
    setPendingCredentials(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950 relative overflow-hidden">
      {/* Top Language Selector */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageToggle />
      </div>

      {/* Background Glow Overlay */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />

      <div className="panel-glass w-full max-w-lg p-8 relative border-amber-500/20 shadow-2xl z-10">
        
        {/* Logo Header */}
        <div className="text-center mb-8">
          <Logo size="large" className="justify-center mb-2" />
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            {t('tagline')}
          </p>
        </div>

        {/* Tab switch buttons */}
        {loginStep === 1 && (
          <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 mb-6">
            <button
              onClick={() => { setMode('login'); resetFlow(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('merchantLogin')}
            </button>
            <button
              onClick={() => { setMode('register'); resetFlow(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('registerFirm')}
            </button>
            <button
              onClick={() => { setMode('admin'); resetFlow(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'admin'
                  ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('adminConsole')}
            </button>
          </div>
        )}

        {/* Status Error Display */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <div>
            {loginStep === 1 ? (
              <form onSubmit={handleLoginInit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('merchantUserId')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('userIdPlaceholder')}
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-all font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('registeredGst')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('gstPlaceholder')}
                    value={gstInput}
                    onChange={(e) => setGstInput(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-all font-mono uppercase"
                  />
                </div>

                <Button type="submit" variant="gold" loading={loading} className="w-full mt-2" icon={ArrowRight} iconPosition="right">
                  {t('requestOtp')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLoginVerify} className="space-y-5">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed">
                  {t('enterOtpMsg')}
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 text-center">
                    {t('enterOtpLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="******"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-full px-4 py-3 text-2xl font-mono text-center tracking-[12px] bg-slate-950/80 border border-amber-500/50 rounded-xl text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-bold"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setLoginStep(1)} className="flex-1">
                    {t('back')}
                  </Button>
                  <Button type="submit" variant="gold" loading={loading} className="flex-[2]">
                    {t('verifyAndAccess')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* REGISTER MODE */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Role Selection Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div
                onClick={() => setRole('buyer')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  role === 'buyer'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <UserCheck size={20} className={role === 'buyer' ? 'text-cyan-400' : 'text-slate-500'} />
                <div className="font-bold text-xs mt-2">{t('buyerFirm')}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{t('wholesalersDealers')}</div>
              </div>
              
              <div
                onClick={() => setRole('supplier')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  role === 'supplier'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Sprout size={20} className={role === 'supplier' ? 'text-emerald-400' : 'text-slate-500'} />
                <div className="font-bold text-xs mt-2">{t('supplierFirm')}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{t('farmersCollectives')}</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                {t('tradeName')}
              </label>
              <input
                type="text"
                required
                placeholder={t('tradeNamePlaceholder')}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {t('emailAddress')}
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@firm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {t('securityPassword')}
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {t('registeredGst')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="27AAAAA1111A1Z1"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {t('contactPhone')}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                {t('operatingAddress')}
              </label>
              <textarea
                rows={2}
                required
                placeholder="Full address of processing unit or farm"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
              {t('submitRegistration')}
            </Button>
          </form>
        )}

        {/* ADMIN MODE */}
        {mode === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300/90 flex items-center gap-2.5">
              <Lock size={16} className="text-amber-400 shrink-0" />
              <span>{t('adminPrompt')}</span>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {t('adminEmail')}
              </label>
              <input
                type="email"
                required
                placeholder="admin@nelmani.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {t('masterPassword')}
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-all font-mono"
              />
            </div>

            <Button type="submit" variant="gold" loading={loading} className="w-full mt-2">
              {t('authenticateConsole')}
            </Button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
