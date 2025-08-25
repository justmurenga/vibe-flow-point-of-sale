import { createRoot } from 'react-dom/client'
import React from 'react'
import App from './App.tsx'
import './index.css'



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
  
  try {
    const root = createRoot(rootElement);
    
    root.render(<App />);
    
  } catch (error) {
    console.error('❌ [MAIN] Error during React initialization:', error);
    throw error;
  }
}
