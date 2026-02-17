
import React from 'react';
import Layout from './components/Layout';
// import Slideshow from './components/Slideshow';
import './index.css';

function App() {
  return (
    <Layout>
      {/* <Slideshow interval={10000} /> */}
      <div className="center-content">
        <h1>SaveMyPortal</h1>
        <p>Baseline Test: Heartbeat Only</p>
      </div>
    </Layout>
  );
}

export default App;
