import React, { useEffect, useState, useContext } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { initializeErrorReporting, reportCurrentContext } from "../diag/errorReporter";

// Diagnostic Checkout Component for White Screen Debugging
export default function Checkout() {
  const [diagnosticData, setDiagnosticData] = useState({});
  const [renderError, setRenderError] = useState(null);
  const [paypalReady, setPaypalReady] = useState(false);

  // Initialize error reporting immediately
  useEffect(() => {
    console.log('🔧 DIAGNOSTIC CHECKOUT COMPONENT MOUNTED');
    initializeErrorReporting();
  }, []);

  // Safely get context data with error boundaries
  let currentUser = null;
  let cartItems = [];
  let totalPrice = 0;
  let authError = null;
  let cartError = null;

  try {
    const authContext = useAuth();
    currentUser = authContext?.currentUser || null;
    console.log('👤 Auth Context:', { currentUser: currentUser?.email || 'Not logged in' });
  } catch (error) {
    authError = error;
    console.error('🚨 Auth Context Error:', error);
  }

  try {
    const cartContext = useCart();
    cartItems = cartContext?.items || [];
    totalPrice = cartContext?.getTotalPrice?.() || 0;
    console.log('🛒 Cart Context:', { itemCount: cartItems.length, totalPrice });
  } catch (error) {
    cartError = error;
    console.error('🚨 Cart Context Error:', error);
  }

  // Check PayPal availability
  useEffect(() => {
    const checkPayPal = () => {
      const paypalBefore = !!window.paypal;
      console.log('💳 PayPal SDK Before Provider:', paypalBefore);
      
      setTimeout(() => {
        const paypalAfter = !!window.paypal;
        console.log('💳 PayPal SDK After Provider:', paypalAfter);
        setPaypalReady(paypalAfter);
      }, 2000);
    };

    checkPayPal();
  }, []);

  // Report diagnostic context
  useEffect(() => {
    const context = {
      currentUser: currentUser?.email || 'Not logged in',
      cartItems: cartItems.length,
      totalPrice,
      authError: authError?.message,
      cartError: cartError?.message,
      paypalReady
    };

    setDiagnosticData(context);
    reportCurrentContext(context);
  }, [currentUser, cartItems.length, totalPrice, authError, cartError, paypalReady]);

  // Error boundary for render errors
  const ErrorBoundary = ({ children }) => {
    try {
      return children;
    } catch (error) {
      console.error('🚨 Render Error:', error);
      setRenderError(error);
      return (
        <div className="bg-red-900 border border-red-500 p-4 rounded-lg">
          <h3 className="text-red-300 font-bold">Render Error Caught:</h3>
          <pre className="text-red-200 text-sm mt-2 overflow-auto">
            {error.stack || error.message}
          </pre>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🔧 Diagnostic Checkout</h1>
        
        {/* Diagnostic Information Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Context Status */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">📊 Context Status</h2>
            <div className="space-y-2 text-sm">
              <div>👤 User: <span className="text-green-400">{currentUser?.email || 'Not logged in'}</span></div>
              <div>🛒 Cart Items: <span className="text-blue-400">{cartItems.length}</span></div>
              <div>💰 Total Price: <span className="text-green-400">RM {totalPrice.toFixed(2)}</span></div>
              <div>💳 PayPal Ready: <span className={paypalReady ? 'text-green-400' : 'text-red-400'}>{paypalReady ? 'Yes' : 'No'}</span></div>
            </div>
          </div>

          {/* Error Status */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-red-400">🚨 Error Status</h2>
            <div className="space-y-2 text-sm">
              <div>Auth Error: <span className="text-red-400">{authError?.message || 'None'}</span></div>
              <div>Cart Error: <span className="text-red-400">{cartError?.message || 'None'}</span></div>
              <div>Render Error: <span className="text-red-400">{renderError?.message || 'None'}</span></div>
              <div>Total Errors: <span className="text-yellow-400">{(window.__DIAG_ERRORS__ || []).length}</span></div>
            </div>
          </div>
        </div>

        {/* PayPal Integration Test */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-center">💳 PayPal Integration Test</h2>
          
          <ErrorBoundary>
            <PayPalScriptProvider
              options={{
                "client-id": "Aag7jzHJY7SsZcOvhDOFxy2kGcRQkvwEwORrd44WQS9m5TEeTEDpHmJfgE3yhEH3vneehCFf6bXBgrbA",
                currency: "MYR",
              }}
              onLoadScript={() => {
                console.log('✅ PayPal Script Loaded Successfully');
                setPaypalReady(true);
              }}
              onError={(error) => {
                console.error('🚨 PayPal Script Load Error:', error);
                window.__DIAG_ERRORS__.push({
                  type: 'paypal-script-error',
                  error: error.toString(),
                  timestamp: new Date().toISOString()
                });
              }}
            >
              <div className="flex justify-center">
                <div className="w-96">
                  <ErrorBoundary>
                    <PayPalButtons
                      style={{ layout: "vertical", color: "gold" }}
                      createOrder={(data, actions) => {
                        console.log('💳 Creating PayPal Order...');
                        try {
                          return actions.order.create({
                            purchase_units: [
                              {
                                amount: {
                                  value: totalPrice > 0 ? totalPrice.toFixed(2) : "10.00",
                                },
                              },
                            ],
                          });
                        } catch (error) {
                          console.error('🚨 Create Order Error:', error);
                          throw error;
                        }
                      }}
                      onApprove={(data, actions) => {
                        console.log('✅ PayPal Payment Approved:', data);
                        return actions.order.capture().then((details) => {
                          console.log('✅ Payment Captured:', details);
                          alert("✅ Payment successful! Your order has been placed.");
                        });
                      }}
                      onError={(err) => {
                        console.error("🚨 PayPal Button Error:", err);
                        window.__DIAG_ERRORS__.push({
                          type: 'paypal-button-error',
                          error: err.toString(),
                          timestamp: new Date().toISOString()
                        });
                        alert("❌ Payment failed — check console for details.");
                      }}
                      onCancel={(data) => {
                        console.log('⚠️ PayPal Payment Cancelled:', data);
                      }}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </PayPalScriptProvider>
          </ErrorBoundary>

          {/* Fallback Button */}
          {!paypalReady && (
            <div className="mt-4 text-center">
              <div className="bg-yellow-900 border border-yellow-500 p-4 rounded-lg mb-4">
                <p className="text-yellow-300">⚠️ PayPal buttons not ready. Using fallback.</p>
              </div>
              <button 
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
                onClick={() => {
                  alert('This is a fallback button. PayPal SDK failed to load.');
                  console.log('🔧 Fallback button clicked');
                }}
              >
                🔧 Diagnostic Fallback Button
              </button>
            </div>
          )}
        </div>

        {/* Error Details */}
        {(window.__DIAG_ERRORS__ || []).length > 0 && (
          <div className="mt-6 bg-red-900 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-red-300">🚨 Captured Errors</h2>
            <pre className="text-red-200 text-xs overflow-auto max-h-64">
              {JSON.stringify(window.__DIAG_ERRORS__, null, 2)}
            </pre>
          </div>
        )}

        {/* Debug Actions */}
        <div className="mt-6 text-center space-x-4">
          <button 
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
            onClick={() => reportCurrentContext(diagnosticData)}
          >
            📊 Report Context
          </button>
          <button 
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
            onClick={() => {
              window.__DIAG_ERRORS__ = [];
              setRenderError(null);
              console.log('🧹 Errors cleared');
            }}
          >
            🧹 Clear Errors
          </button>
        </div>
      </div>
    </div>
  );
}
