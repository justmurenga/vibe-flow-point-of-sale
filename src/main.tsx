import { createRoot } from 'react-dom/client'
import React from 'react'
import App from './App.tsx'
import './index.css'

console.log('🚀 [MAIN] Starting application initialization...');
console.log('🚀 [MAIN] React version:', React.version);
console.log('🚀 [MAIN] React object:', React);
console.log('🚀 [MAIN] React.useState available:', typeof React.useState);

// Add this check to ensure React is properly loaded
if (!React) {
  console.error('❌ [MAIN] React is not properly loaded');
  throw new Error('React is not properly loaded');
}

if (typeof React.useState !== 'function') {
  console.error('❌ [MAIN] React.useState is not a function:', typeof React.useState);
  throw new Error('React.useState is not available');
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ [MAIN] Root element not found");
} else {
  console.log('✅ [MAIN] Root element found, creating React root...');
  try {
    const root = createRoot(rootElement);
    console.log('✅ [MAIN] React root created successfully');
    console.log('🚀 [MAIN] Rendering App component...');
    root.render(<App />);
    console.log('✅ [MAIN] App component rendered successfully');
  } catch (error) {
    console.error('❌ [MAIN] Error during React initialization:', error);
    throw error;
  }
}
