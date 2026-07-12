import React from 'react';
import { DriverManagement } from './DriverManagement.jsx';

function App() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Inter, sans-serif', color: '#2d3748', textAlign: 'center', margin: '20px 0' }}>
        TransitOps - Drivers Portal
      </h1>
      <DriverManagement />
    </div>
  );
}

export default App;
