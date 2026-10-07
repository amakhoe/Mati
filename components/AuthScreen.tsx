'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Droplets, Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';

export function AuthScreen() {
  const { signIn, signUp, authError, clearAuthError } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setLocalMessage(null);

    if (!email || !password) {
      setLocalMessage('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    if (isRegisterMode && password !== confirmPassword) {
      setLocalMessage('As palavras-passe não coincidem.');
      return;
    }

    if (password.length < 6) {
      setLocalMessage('A palavra-passe deve conter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (isRegisterMode) {
        await signUp(email, password);
        setLocalMessage('Conta criada com sucesso! A iniciar sessão...');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      // Error is caught and set in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('operador.manhica@aguas.mz');
    setPassword('Manhica2026!');
    clearAuthError();
    setLocalMessage('Credenciais preenchidas. Clique em "Iniciar Sessão" ou "Criar Conta de Operador".');
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-50 via-slate-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-linear-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-xl shadow-sky-500/25 ring-4 ring-sky-100">
          <Droplets className="w-9 h-9" />
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Águas da Manhiça
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 flex items-center justify-center gap-1">
          <MapPin className="w-4 h-4 text-sky-600" />
          Comunidade & Vila da Manhiça • Província de Maputo
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Sistema de Gestão de Clientes, Faturas (m³) e Postos de Abastecimento
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-sky-100">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                clearAuthError();
                setLocalMessage(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-colors ${
                !isRegisterMode
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Iniciar Sessão
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                clearAuthError();
                setLocalMessage(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-colors ${
                isRegisterMode
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Criar Conta Operador
            </button>
          </div>

          {(authError || localMessage) && (
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
              <span className="leading-relaxed">{authError || localMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email do Operador / Gestor
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
                  placeholder="ex: operador@aguasmanhica.mz"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Palavra-passe (Password)
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
                />
              </div>
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmar Palavra-passe
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a palavra-passe"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-linear-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : isRegisterMode ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Criar Conta de Operador</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2 px-3 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Preencher Credenciais Rápidas de Teste</span>
            </button>
            <p className="mt-2 text-[11px] text-center text-slate-400">
              Autenticação segura via Firebase Auth (Email & Password).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
