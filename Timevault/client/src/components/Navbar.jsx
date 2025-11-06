import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { itemCount } = useCart();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-black text-white shadow-lg px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-sm bg-black/95">
      <h1
        className="text-2xl font-bold text-gold cursor-pointer hover:text-yellow-400 transition duration-300"
        onClick={() => navigate("/")}
      >
        TimeVault
      </h1>

      <div className="flex space-x-8 relative">
        <Link
          to="/"
          className={`relative text-lg transition duration-300 group ${
            isActive("/") ? "text-gold" : "text-white hover:text-gold"
          }`}
        >
          Home
          <span
            className={`absolute bottom-0 left-0 w-full h-0.5 bg-gold transform transition-transform duration-300 ${
              isActive("/") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            }`}
          ></span>
          <span
            className={`absolute inset-0 rounded-md bg-gold/10 transform transition-transform duration-300 ${
              isActive("/") ? "scale-100" : "scale-0 group-hover:scale-100"
            }`}
          ></span>
        </Link>

        <Link
          to="/browse"
          className={`relative text-lg transition duration-300 group ${
            isActive("/browse") ? "text-gold" : "text-white hover:text-gold"
          }`}
        >
          Browse
          <span
            className={`absolute bottom-0 left-0 w-full h-0.5 bg-gold transform transition-transform duration-300 ${
              isActive("/browse") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            }`}
          ></span>
          <span
            className={`absolute inset-0 rounded-md bg-gold/10 transform transition-transform duration-300 ${
              isActive("/browse") ? "scale-100" : "scale-0 group-hover:scale-100"
            }`}
          ></span>
        </Link>

        <Link
          to="/serial-validation"
          className={`relative text-lg transition duration-300 group ${
            isActive("/serial-validation") ? "text-gold" : "text-white hover:text-gold"
          }`}
        >
          Validate
          <span
            className={`absolute bottom-0 left-0 w-full h-0.5 bg-gold transform transition-transform duration-300 ${
              isActive("/serial-validation") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            }`}
          ></span>
          <span
            className={`absolute inset-0 rounded-md bg-gold/10 transform transition-transform duration-300 ${
              isActive("/serial-validation") ? "scale-100" : "scale-0 group-hover:scale-100"
            }`}
          ></span>
        </Link>

        <Link
          to="/track-delivery"
          className={`relative text-lg transition duration-300 group ${
            isActive("/track-delivery") ? "text-gold" : "text-white hover:text-gold"
          }`}
        >
          Track Order
          <span
            className={`absolute bottom-0 left-0 w-full h-0.5 bg-gold transform transition-transform duration-300 ${
              isActive("/track-delivery") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            }`}
          ></span>
          <span
            className={`absolute inset-0 rounded-md bg-gold/10 transform transition-transform duration-300 ${
              isActive("/track-delivery") ? "scale-100" : "scale-0 group-hover:scale-100"
            }`}
          ></span>
        </Link>

        {currentUser && (
          <Link
            to="/order-history"
            className={`relative text-lg transition duration-300 group ${
              isActive("/order-history") ? "text-gold" : "text-white hover:text-gold"
            }`}
          >
            My Orders
            <span
              className={`absolute bottom-0 left-0 w-full h-0.5 bg-gold transform transition-transform duration-300 ${
                isActive("/order-history") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`}
            ></span>
            <span
              className={`absolute inset-0 rounded-md bg-gold/10 transform transition-transform duration-300 ${
                isActive("/order-history") ? "scale-100" : "scale-0 group-hover:scale-100"
              }`}
            ></span>
          </Link>
        )}

        <Link
          to="/about"
          className={`relative text-lg transition duration-300 group ${
            isActive("/about") ? "text-gold" : "text-white hover:text-gold"
          }`}
        >
          About
          <span
            className={`absolute bottom-0 left-0 w-full h-0.5 bg-gold transform transition-transform duration-300 ${
              isActive("/about") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            }`}
          ></span>
          <span
            className={`absolute inset-0 rounded-md bg-gold/10 transform transition-transform duration-300 ${
              isActive("/about") ? "scale-100" : "scale-0 group-hover:scale-100"
            }`}
          ></span>
        </Link>

        {/* Wishlist Link */}
        <Link
          to="/wishlist"
          className={`relative text-lg transition duration-300 group ${
            isActive("/wishlist") ? "text-gold" : "text-white hover:text-gold"
          }`}
        >
          Wishlist
          <span
            className={`absolute bottom-0 left-0 w-full h-0.5 bg-gold transform transition-transform duration-300 ${
              isActive("/wishlist") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            }`}
          ></span>
          <span
            className={`absolute inset-0 rounded-md bg-gold/10 transform transition-transform duration-300 ${
              isActive("/wishlist") ? "scale-100" : "scale-0 group-hover:scale-100"
            }`}
          ></span>
        </Link>

        {currentUser && (
          <Link
            to="/add-watch"
            className={`relative text-lg transition duration-300 group ${
              isActive("/add-watch")
                ? "text-gold"
                : "text-white hover:text-gold"
            }`}
          >
            Add Watch
            <span
              className={`absolute bottom-0 left-0 w-full h-0.5 bg-gold transform transition-transform duration-300 ${
                isActive("/add-watch") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`}
            ></span>
            <span
              className={`absolute inset-0 rounded-md bg-gold/10 transform transition-transform duration-300 ${
                isActive("/add-watch") ? "scale-100" : "scale-0 group-hover:scale-100"
              }`}
            ></span>
          </Link>
        )}

        {currentUser?.role === "admin" && (
          <Link
            to="/admin"
            className={`relative text-lg transition duration-300 group ${
              isActive("/admin") ? "text-gold" : "text-white hover:text-gold"
            }`}
          >
            Dashboard
            <span
              className={`absolute bottom-0 left-0 w-full h-0.5 bg-gold transform transition-transform duration-300 ${
                isActive("/admin") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`}
            ></span>
            <span
              className={`absolute inset-0 rounded-md bg-gold/10 transform transition-transform duration-300 ${
                isActive("/admin") ? "scale-100" : "scale-0 group-hover:scale-100"
              }`}
            ></span>
          </Link>
        )}

        {/* Cart Link */}
        <Link
          to="/cart"
          className={`relative text-lg transition duration-300 group ${
            isActive("/cart") ? "text-gold" : "text-white hover:text-gold"
          }`}
        >
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            Cart
            {itemCount > 0 && (
              <span className="ml-1 bg-gold text-black text-xs font-bold px-2 py-1 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
          <span
            className={`absolute bottom-0 left-0 w-full h-0.5 bg-gold transform transition-transform duration-300 ${
              isActive("/cart") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            }`}
          ></span>
          <span
            className={`absolute inset-0 rounded-md bg-gold/10 transform transition-transform duration-300 ${
              isActive("/cart") ? "scale-100" : "scale-0 group-hover:scale-100"
            }`}
          ></span>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {!currentUser ? (
          <>
            <button
              onClick={() => navigate("/login")}
              className="text-white hover:text-gold transition duration-300 px-3 py-1 rounded-md hover:bg-gold/10"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="text-gold border border-gold px-4 py-2 rounded-lg hover:bg-gold hover:text-black transition duration-300 font-semibold"
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            <span className="text-gray-300 text-sm mr-4">
              Welcome, {currentUser.email}
            </span>
            <button
              onClick={() => navigate("/profile")}
              className="text-white hover:text-gold transition duration-300 px-3 py-1 rounded-md hover:bg-gold/10 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="text-white hover:text-gold transition duration-300 px-3 py-1 rounded-md hover:bg-gold/10"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
