import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Editors from './components/Editors';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="App">
      {activeTab === 'dashboard' ? (
        <Dashboard onTabChange={setActiveTab} />
      ) : (
        <Editors onTabChange={setActiveTab} />
      )}
    </div>
  );
}

export default App;