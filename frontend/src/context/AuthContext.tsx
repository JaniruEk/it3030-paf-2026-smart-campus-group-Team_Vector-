import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from '../config/firebase';

interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  updateUserPassword: (newPass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up Firebase Auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Firebase Auth triggered!", user);
      if (user) {
        try {
          // Force refresh to get the latest custom claims (roles)
          const idTokenResult = await user.getIdTokenResult(true);
          const role = idTokenResult.claims.role as string || 'USER';
          setUserRole(role);
        } catch (e) {
          console.error("Failed to fetch custom claims:", e);
          setUserRole('USER');
        }
      } else {
        setUserRole(null);
      }
      setCurrentUser(user);
      setLoading(false);
    }, (error) => {
      console.error("Firebase Auth Error:", error);
      setLoading(false);
    });

    // Fallback in case Firebase silent-fails
    const timeout = setTimeout(() => {
        if(loading) {
            console.log("Firebase taking too long, forcefully releasing loading lock.");
            setLoading(false);
        }
    }, 4000);

    return () => {
        clearTimeout(timeout);
        unsubscribe();
    };
  }, []);

  const login = async () => {
    await loginWithGoogle();
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signupWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const updateUserPassword = async (newPass: string) => {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPass);
    } else {
      throw new Error("No user is currently logged in.");
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const value = {
    currentUser,
    userRole,
    loading,
    login,
    loginWithEmail,
    signupWithEmail,
    updateUserPassword,
    resetPassword,
    sendVerificationEmail,
    logout: handleLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

