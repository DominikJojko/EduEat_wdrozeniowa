import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
// Ogólne
import Footer from './Footer';
import Navbar from './components/Home/Navbar';
// Kontekst
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './context/PrivateRoute'; 
// Home
import Home from './components/Home/Home';
import About from './components/Home/About';
import Login from './components/Home/Login';
import Register from './components/Home/Register';
import UpdateClass from './components/Home/UpdateClass';
// UserProfile
import OrderForm from './components/UserProfile/OrderForm';
import UserProfile from './components/UserProfile/UserProfile'; 
// AdminPanel
import AdminPanel from './components/AdminPanel/AdminPanel';
import ListOrders from './components/AdminPanel/ListOrders';
import AddUser from './components/AdminPanel/AddUser';
import ManageClasses from './components/AdminPanel/ManageClasses';
import MakeMeals from './components/AdminPanel/MakeMeals';
import Obiady from './components/AdminPanel/Obiady';
import Uzytkownicy from './components/AdminPanel/Uzytkownicy';
import ManageUsers from './components/AdminPanel/ManageUsers';
import MealPrice from './components/AdminPanel/MealPrice';
import EndOfYear from './components/AdminPanel/EndOfYear';
import UserMealsManagement from './components/AdminPanel/UserMealsManagement';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Strony główne i login */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Funkcjonalności użytkownika */}
          <Route path="/order" element={<PrivateRoute><OrderForm /></PrivateRoute>} />
          <Route path="/user-profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
          <Route path="/update-class" element={<PrivateRoute><UpdateClass /></PrivateRoute>} />
          
          {/* Funkcjonalności administracyjne (dostępne tylko dla administratorów) */}
          <Route path="/admin-panel" element={<PrivateRoute roleRequired={3}><AdminPanel /></PrivateRoute>} />
          <Route path="/admin-panel/list-orders" element={<PrivateRoute roleRequired={3}><ListOrders /></PrivateRoute>} />
          <Route path="/admin-panel/add-user" element={<PrivateRoute roleRequired={3}><AddUser /></PrivateRoute>} />
          <Route path="/admin-panel/manage-classes" element={<PrivateRoute roleRequired={3}><ManageClasses /></PrivateRoute>} />
          <Route path="/admin-panel/make-meals" element={<PrivateRoute roleRequired={3}><MakeMeals /></PrivateRoute>} />
          <Route path="/admin-panel/obiady" element={<PrivateRoute roleRequired={3}><Obiady /></PrivateRoute>} />
          <Route path="/admin-panel/uzytkownicy" element={<PrivateRoute roleRequired={3}><Uzytkownicy /></PrivateRoute>} />
          <Route path="/admin-panel/manage-users" element={<PrivateRoute roleRequired={3}><ManageUsers /></PrivateRoute>} />
          <Route path="/admin-panel/meal-price" element={<PrivateRoute roleRequired={3}><MealPrice /></PrivateRoute>} />
          <Route path="/admin-panel/end-of-year" element={<PrivateRoute roleRequired={3}><EndOfYear /></PrivateRoute>} />
          <Route path="/admin-panel/user-meals" element={<PrivateRoute roleRequired={3}><UserMealsManagement /></PrivateRoute>} />
          </Routes>
        <Footer />
      </AuthProvider>
    </Router>
  );
}

export default App;
