
import React from 'react';
import Layout from './components/Layout';
// import Slideshow from './components/Slideshow';
import Slideshow from './components/Slideshow';
import DualVideoTest from './components/DualVideoTest';
import './index.css';

function App() {
  return (
    <Layout>
      {/* <Slideshow interval={10000} /> */}

      {/* EXPERIMENT: Uncomment to test dual video hardware support */}
      <DualVideoTest />

      {/* <div className="center-content">
          <h1>SaveMyPortal</h1>
          <p>Baseline Test: Heartbeat Only</p>
      </div> */}
    </Layout>
  );
}

export default App;
