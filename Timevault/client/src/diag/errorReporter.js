// Diagnostic Error Reporter for TimeVault Checkout
// This utility captures and reports errors for debugging white screen issues

export const initializeErrorReporting = () => {
  // Initialize global error storage
  if (!window.__DIAG_ERRORS__) {
    window.__DIAG_ERRORS__ = [];
  }

  // Capture window errors
  window.addEventListener('error', (event) => {
    const errorInfo = {
      type: 'error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack || event.error,
      timestamp: new Date().toISOString()
    };
    
    window.__DIAG_ERRORS__.push(errorInfo);
    console.error('🚨 Window Error Captured:', errorInfo);
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorInfo = {
      type: 'unhandledrejection',
      reason: event.reason,
      promise: event.promise,
      timestamp: new Date().toISOString()
    };
    
    window.__DIAG_ERRORS__.push(errorInfo);
    console.error('🚨 Unhandled Rejection Captured:', errorInfo);
  });

  console.log('✅ Error reporting initialized');
};

export const reportCurrentContext = (context = {}) => {
  console.group('🔍 DIAGNOSTIC CONTEXT REPORT');
  
  // Report current context
  console.log('📊 Current Context:', context);
  
  // Report all captured errors
  console.log('🚨 Captured Errors:', window.__DIAG_ERRORS__ || []);
  
  // Report PayPal availability
  console.log('💳 PayPal SDK Available:', !!window.paypal);
  
  // Report React/DOM state
  console.log('🌐 Document Ready State:', document.readyState);
  console.log('⚛️ React Dev Tools:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
  
  // Report network/console state
  console.log('🌍 Navigator Online:', navigator.onLine);
  console.log('📱 User Agent:', navigator.userAgent);
  
  console.groupEnd();
  
  return {
    errors: window.__DIAG_ERRORS__ || [],
    context,
    paypalAvailable: !!window.paypal,
    documentReady: document.readyState,
    online: navigator.onLine
  };
};

export const clearDiagnosticErrors = () => {
  window.__DIAG_ERRORS__ = [];
  console.log('🧹 Diagnostic errors cleared');
};
