import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, loginUser, signUpUser, signOutUser, signInWithGoogle } from "../firebase/methods";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password, rememberMe = true) => {
    return await loginUser({ email, password, rememberMe });
  };

  const loginWithGoogle = async () => {
    return await signInWithGoogle();
  };

  const register = async (email, password, additionalData = {}) => {
    return await signUpUser({ email, password, ...additionalData });
  };

  const logout = async () => {
    return await signOutUser();
  };

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
