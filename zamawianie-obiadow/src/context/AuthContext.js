import React, { createContext, useState, useContext } from 'react';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const parsedAuth = JSON.parse(storedAuth);
      return {
        isAuthenticated: true,
        user: { username: parsedAuth.username, role_id: parsedAuth.role_id, id: parsedAuth.id },
        token: parsedAuth.token,
      };
    } else {
      return {
        isAuthenticated: false,
        user: null,
        role_id: null,
        token: null,
      };
    }
  });

  const login = (token, userDetails, callback) => {
    console.log("Logging in user", userDetails);
    const { username, role_id, id } = userDetails;
    setAuthState({
      isAuthenticated: true,
      user: { username, role_id, id },
      token,
    });
    localStorage.setItem('auth', JSON.stringify({ token, username, role_id, id }));
    if (callback) callback();
  };
  
  
  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      role_id: null, 
      token: null,
    });
    localStorage.removeItem('auth');
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
