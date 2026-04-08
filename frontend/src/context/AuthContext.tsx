import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, sendPasswordResetEmail, sendEmailVerification, updateProfile } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, loginWithGoogle, logout, db } from '../config/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface UserProfile {
  photoURL: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  userRole: string | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  updateUserPassword: (newPass: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up Firebase Auth state listener...");
    let unsubscribeProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log("Firebase Auth triggered!", user);
      // Clean up previous profile listener if it exists
      unsubscribeProfile();

      if (user) {
        try {
          // Force refresh to get the latest custom claims (roles)
          const idTokenResult = await user.getIdTokenResult(true);
          const role = idTokenResult.claims.role as string || 'USER';
          setUserRole(role);

          // Subscribe to Firestore profile changes
          unsubscribeProfile = onSnapshot(doc(db, 'profiles', user.uid), (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserProfile);
            } else {
              setUserProfile(null);
            }
          });

        } catch (e) {
          console.error("Failed to fetch custom claims:", e);
          setUserRole('USER');
          setUserProfile(null);
        }
      } else {
        setUserRole(null);
        setUserProfile(null);
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
        unsubscribeAuth();
        unsubscribeProfile();
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

  const updateUserProfile = async (displayName: string, photoURL: string) => {
    if (auth.currentUser) {
      // Update Auth display name (this doesn't have the strict length limit of photoURL)
      await updateProfile(auth.currentUser, { displayName });
      
      // Save the Base64 photoURL to Firestore (has massive 1MB limit)
      await setDoc(doc(db, 'profiles', auth.currentUser.uid), { photoURL }, { merge: true });

      // Re-trigger auth state change to update local currentUser state
      const user = auth.currentUser;
      setCurrentUser({...user} as User);
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
    userProfile,
    userRole,
    loading,
    login,
    loginWithEmail,
    signupWithEmail,
    updateUserPassword,
    updateUserProfile,
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

