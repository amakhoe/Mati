'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Droplets,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  MapPin,
  KeyRound,
  ShieldAlert,
  ArrowLeft,
  Timer,
  Info,
  ShieldCheck,
  User,
} from 'lucide-react';
import { DEFAULT_DATABASE_OPERATORS } from '@/types/water-system';

type AuthViewMode = 'login' | 'register' | 'forgot-password';

export function AuthScreen() {
  const {
    signIn,
    signUp,
    sendPasswordReset,
    authError,
    clearAuthError,
    failedAttempts,
    isLocked,
    lockoutSeconds,
  } = useAuth();

  const [mode, setMode] = useState<AuthViewMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setFeedbackSuccess(null);

    if (!email || !password) {
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch {
      // Error is caught and tracked in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setFeedbackSuccess(null);

    if (password !== confirmPassword) {
      return;
    }

    if (password.length < 6) {
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name.trim());
      setFeedbackSuccess('Conta criada e autenticada com sucesso no Firebase!');
    } catch {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setFeedbackSuccess(null);

    if (!email) {
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setFeedbackSuccess(
        `Email de redefinição de palavra-passe enviado com sucesso para ${email}! Verifique a sua caixa de entrada e pasta de spam para definir uma nova palavra-passe.`
      );
    } catch {
      // Handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword('Manhica2026!');
    clearAuthError();
    setFeedbackSuccess(`Conta selecionada: ${accountEmail}`);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-50 via-slate-50 to-blue-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-linear-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-xl shadow-sky-500/25 ring-4 ring-sky-100">
          <Droplets className="w-9 h-9" />
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Águas da Manhiça
        </h1>
        <p className="mt-1 text-sm text-slate-600 flex items-center justify-center gap-1">
          <MapPin className="w-4 h-4 text-sky-600" />
          Sistema de Abastecimento de Água • Vila da Manhiça
        </p>

        {/* Firebase Authentication Badge */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>Firebase Authentication (Email & Palavra-passe)</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-sky-100">
          {/* Navigation Tabs */}
          {mode !== 'forgot-password' ? (
            <div className="flex border-b border-slate-200 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  clearAuthError();
                  setFeedbackSuccess(null);
                }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'border-sky-600 text-sky-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Iniciar Sessão
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  clearAuthError();
                  setFeedbackSuccess(null);
                }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'border-sky-600 text-sky-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Novo Registo
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  clearAuthError();
                  setFeedbackSuccess(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Início de Sessão</span>
              </button>
              <span className="text-xs font-semibold text-slate-400">Recuperação</span>
            </div>
          )}

          {/* Invalid Attempts & Security Lockout Alert Banner */}
          {isLocked && (
            <div className="mb-5 p-3.5 rounded-xl text-xs bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3 animate-pulse">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-rose-800">
                  Bloqueio Temporário de Segurança Ativo
                </span>
                <p className="text-[11px] leading-relaxed">
                  Foram registadas 5 tentativas incorretas consecutivas. Por motivos de segurança, o acesso está bloqueado por mais{' '}
                  <strong className="text-rose-700 font-bold flex-inline items-center gap-1">
                    <Timer className="w-3 h-3 inline" /> {lockoutSeconds} segundos
                  </strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot-password');
                    clearAuthError();
                  }}
                  className="mt-1 text-xs font-bold text-rose-700 underline hover:text-rose-900 block cursor-pointer"
                >
                  Recuperar Palavra-passe agora →
                </button>
              </div>
            </div>
          )}

          {/* Warning for failed attempts before full lockout */}
          {!isLocked && failedAttempts > 0 && mode === 'login' && (
            <div className="mb-4 p-2.5 rounded-lg text-xs bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Tentativa inválida <strong>{failedAttempts} de 5</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot-password');
                  clearAuthError();
                }}
                className="text-[11px] font-bold text-amber-700 underline hover:text-amber-900 cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          {/* General Feedback Message (Success or Error) */}
          {(authError || feedbackSuccess) && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                authError
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              {authError ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              )}
              <span className="leading-relaxed font-medium">{authError || feedbackSuccess}</span>
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email de Utilizador (Firebase) *
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={isLocked}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: amakhoekars@gmail.com"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Palavra-passe (Password) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot-password');
                      clearAuthError();
                      setFeedbackSuccess(null);
                    }}
                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 transition-colors cursor-pointer"
                  >
                    Esqueceu-se da palavra-passe?
                  </button>
                </div>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    disabled={isLocked}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Palavra-passe configurada"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isLocked}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-linear-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : isLocked ? (
                  <>
                    <Timer className="w-4 h-4" />
                    <span>Bloqueado ({lockoutSeconds}s)</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Iniciar Sessão (Firebase)</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: FORGOT PASSWORD / RECUPERAÇÃO DE PASSWORD */}
          {mode === 'forgot-password' && (
            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <KeyRound className="w-4 h-4 text-sky-600" />
                  <span>Recuperar Palavra-passe</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Introduza o endereço de email associado à sua conta Firebase. Enviaremos um link oficial de redefinição de palavra-passe.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email de Utilizador *
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: amakhoekars@gmail.com"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 flex items-start gap-2 text-xs text-sky-800">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" />
                <span>
                  O link de redefinição é gerado com segurança pelo Firebase Authentication e enviado para o seu correio eletrónico.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-linear-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Enviar Link de Recuperação</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  clearAuthError();
                  setFeedbackSuccess(null);
                }}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 cursor-pointer"
              >
                Lembrou-se da palavra-passe? Voltar ao login
              </button>
            </form>
          )}

          {/* MODE 3: REGISTER NEW USER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo do Operador / Gestor *
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Carlos Sitoe"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email para Autenticação Firebase *
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: operador@aguas.mz"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Palavra-passe (Mínimo 6 caracteres) *
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmar Palavra-passe *
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a palavra-passe"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-linear-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Criar Conta & Autenticar</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Selector for Pre-configured Firebase Accounts */}
          {mode === 'login' && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                Contas Pré-configuradas no Firebase:
              </span>
              <div className="space-y-1.5">
                {DEFAULT_DATABASE_OPERATORS.map((op) => (
                  <button
                    key={op.email}
                    type="button"
                    onClick={() => handleSelectAccount(op.email)}
                    className={`w-full py-1.5 px-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      email === op.email
                        ? 'bg-sky-100 border-sky-300 text-sky-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-200'
                    }`}
                  >
                    <div className="truncate">
                      <span className="font-semibold block">{op.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{op.email}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-white border border-slate-200 text-slate-600 shrink-0">
                      {op.role}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-3 flex items-start gap-1.5 text-[10px] text-slate-400 leading-relaxed justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  Autenticação segura via Firebase Authentication. Acesso protegido contra tentativas excessivas.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
