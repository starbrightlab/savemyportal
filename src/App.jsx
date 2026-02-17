
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Slideshow from './components/Slideshow';
// import DualVideoTest from './components/DualVideoTest';
import './index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/slideshow" element={<Slideshow />} />
          <Route path="/settings" element={<Settings />} />
          {/* <Route path="/test" element={<DualVideoTest />} /> */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
