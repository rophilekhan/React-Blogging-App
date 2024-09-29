import { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Add authentication logic here
  }, []);

  const useAuth = () => {
    return { user, setUser };
  };

  return (
    <AuthContext.Provider value={{ useAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };