import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Slideshow from './components/Slideshow';
import Onboarding from './pages/Onboarding';
import { AuthProvider } from './context/AuthContext';
// import DualVideoTest from './components/DualVideoTest';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/slideshow" element={<Slideshow />} />
                <Route path="/settings" element={<Settings />} />
                {/* <Route path="/test" element={<DualVideoTest />} /> */}
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
