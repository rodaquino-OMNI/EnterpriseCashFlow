// src/components/App.jsx
import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import ReportGeneratorApp from './ReportGeneratorApp'; // Assuming ReportGeneratorApp is the refactored main component

export default function App() {
  // This component could also include global context providers if needed
  // e.g., ThemeProvider, AuthProvider, etc.
  return (
    <ErrorBoundary>
      <ReportGeneratorApp />
    </ErrorBoundary>
  );
}