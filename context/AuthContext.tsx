'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, testConnection } from '@/lib/firebase';
import {
  Operator,
  DEFAULT_DATABASE_OPERATORS,
} from '@/types/water-system';
import {
  ensureDefaultOperatorsInDb,
  createOperatorInDb,
  fetchOperatorsFromDb,
} from '@/lib/water-service';

export function getFirebaseErrorMessage(codeOrMessage: string): string {
  if (codeOrMessage.includes('auth/invalid-credential')) {
    return 'Credenciais inválidas: Palavra-passe incorreta ou conta não registada no Firebase Authentication.';
  }
  if (codeOrMessage.includes('auth/wrong-password')) {
    return 'Palavra-passe incorreta para este email no Firebase Authentication.';
  }
  if (codeOrMessage.includes('auth/user-not-found')) {
    return 'Utilizador não encontrado no Firebase Authentication com este email.';
  }
  if (codeOrMessage.includes('auth/invalid-email')) {
    return 'O formato do endereço de email introduzido é inválido.';
  }
  if (codeOrMessage.includes('auth/user-disabled')) {
    return 'Esta conta de utilizador foi desativada no Firebase Authentication.';
  }
  if (codeOrMessage.includes('auth/too-many-requests')) {
    return 'Acesso temporariamente bloqueado pelo Firebase por excesso de tentativas falhadas. Aguarde alguns instantes ou recupere a palavra-passe.';
  }
  if (codeOrMessage.includes('auth/email-already-in-use')) {
    return 'Este endereço de email já se encontra registado no Firebase Authentication.';
  }
  if (codeOrMessage.includes('auth/weak-password')) {
    return 'A palavra-passe deve conter pelo menos 6 caracteres.';
  }
  if (codeOrMessage.includes('auth/network-request-failed')) {
    return 'Erro de rede ao contactar os serviços do Firebase Authentication. Verifique a ligação à internet.';
  }
  return codeOrMessage || 'Ocorreu um erro no Firebase Authentication.';
}

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  currentOperator: Operator | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
  failedAttempts: number;
  isLocked: boolean;
  lockoutSeconds: number;
  resetFailedAttempts: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  currentOperator: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  sendPasswordReset: async () => {},
  logOut: async () => {},
  authError: null,
  clearAuthError: () => {},
  failedAttempts: 0,
  isLocked: false,
  lockoutSeconds: 0,
  resetFailedAttempts: () => {},
});

export const useAuth = () => useContext(AuthContext);

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 60;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [currentOperator, setCurrentOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Security mechanism for invalid login attempts
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Listen to Firebase Authentication state
  useEffect(() => {
    testConnection();
    ensureDefaultOperatorsInDb().catch((e) => console.warn('Init operators error:', e));

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.email) {
        const mappedUser: AppUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email.split('@')[0],
        };
        setUser(mappedUser);

        // Link with Firestore operator data if available
        try {
          const ops = await fetchOperatorsFromDb();
          const match = ops.find(
            (o) => o.email.toLowerCase().trim() === fbUser.email?.toLowerCase().trim()
          );
          if (match) {
            setCurrentOperator(match);
          } else {
            setCurrentOperator({
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email.split('@')[0],
              email: fbUser.email,
              role: 'operator',
              status: 'active',
              createdAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.warn('Operator sync error:', err);
        }
      } else {
        setUser(null);
        setCurrentOperator(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (!isLocked || lockoutSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockoutSeconds]);

  /**
   * Firebase Authentication Login with Invalid Attempts Protection
   */
  const signIn = async (email: string, pass: string): Promise<void> => {
    setAuthError(null);

    if (isLocked) {
      const msg = `Acesso temporariamente bloqueado por motivos de segurança. Aguarde ${lockoutSeconds} segundos ou use a recuperação de palavra-passe.`;
      setAuthError(msg);
      throw new Error(msg);
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !pass) {
      const msg = 'Por favor preencha o email e a palavra-passe.';
      setAuthError(msg);
      throw new Error(msg);
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
      // Successful login resets invalid attempts counter
      setFailedAttempts(0);
      setIsLocked(false);
      setLockoutSeconds(0);
      setAuthError(null);
    } catch (err: any) {
      const errorCode = err?.code || '';

      // Check if credentials match a pre-configured database operator that isn't yet created in Firebase Auth
      const defaultMatch = DEFAULT_DATABASE_OPERATORS.find(
        (op) => op.email.toLowerCase().trim() === cleanEmail.toLowerCase()
      );

      if (
        defaultMatch &&
        defaultMatch.password === pass &&
        (errorCode.includes('user-not-found') || errorCode.includes('invalid-credential'))
      ) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          if (defaultMatch.name) {
            await updateProfile(newCred.user, { displayName: defaultMatch.name });
          }
          setFailedAttempts(0);
          setIsLocked(false);
          setLockoutSeconds(0);
          setAuthError(null);
          return;
        } catch (createErr) {
          console.warn('Auto-provision default account in Firebase Auth error:', createErr);
        }
      }

      // Increment invalid attempts counter
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      const friendlyMsg = getFirebaseErrorMessage(errorCode || err?.message);

      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
        setIsLocked(true);
        setLockoutSeconds(LOCKOUT_DURATION_SECONDS);
        const lockMsg = `Bloqueio de segurança ativado após ${MAX_FAILED_ATTEMPTS} tentativas inválidas. Aguarde ${LOCKOUT_DURATION_SECONDS} segundos ou utilize a opção "Recuperar Palavra-passe" abaixo.`;
        setAuthError(lockMsg);
        throw new Error(lockMsg);
      } else {
        const countMsg = `${friendlyMsg} (Tentativa falhada ${nextAttempts} de ${MAX_FAILED_ATTEMPTS}).`;
        setAuthError(countMsg);
        throw new Error(countMsg);
      }
    }
  };

  /**
   * Password Recovery via Firebase Authentication
   */
  const sendPasswordReset = async (email: string): Promise<void> => {
    setAuthError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      const msg = 'Por favor forneça o endereço de email para envio do link de recuperação.';
      setAuthError(msg);
      throw new Error(msg);
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: any) {
      const friendlyMsg = getFirebaseErrorMessage(err?.code || err?.message);
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  };

  /**
   * Firebase Authentication Sign Up (New Operator)
   */
  const signUp = async (email: string, pass: string, name?: string): Promise<void> => {
    setAuthError(null);
    const cleanEmail = email.trim();
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }

      // Record in Firestore operators collection as well
      try {
        await createOperatorInDb({
          name: name || cleanEmail.split('@')[0],
          email: cleanEmail.toLowerCase(),
          password: pass,
          role: 'operator',
          status: 'active',
          createdAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn('Operator sync in Firestore db error:', dbErr);
      }

      setFailedAttempts(0);
      setIsLocked(false);
      setLockoutSeconds(0);
    } catch (err: any) {
      const friendlyMsg = getFirebaseErrorMessage(err?.code || err?.message);
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  };

  /**
   * Firebase Authentication Sign Out
   */
  const logOut = async (): Promise<void> => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    setUser(null);
    setFirebaseUser(null);
    setCurrentOperator(null);
  };

  const clearAuthError = () => setAuthError(null);
  const resetFailedAttempts = () => {
    setFailedAttempts(0);
    setIsLocked(false);
    setLockoutSeconds(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        currentOperator,
        loading,
        signIn,
        signUp,
        sendPasswordReset,
        logOut,
        authError,
        clearAuthError,
        failedAttempts,
        isLocked,
        lockoutSeconds,
        resetFailedAttempts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
