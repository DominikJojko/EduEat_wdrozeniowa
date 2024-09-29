import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const PrivateRoute = ({ children, roleRequired }) => {
  const { user } = useContext(AuthContext);

  return user && (!roleRequired || user.role_id === roleRequired)
    ? children
    : <Navigate to="/login" replace />;
};

export default PrivateRoute;
