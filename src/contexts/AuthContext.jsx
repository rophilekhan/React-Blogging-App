// AuthContext.js
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const useAuth = () => {
    return { user, setUser };
  };

  return (
    <AuthContext.Provider value={useAuth}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth };