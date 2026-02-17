
import React from 'react';
import Layout from './components/Layout';
import Slideshow from './components/Slideshow';
import './index.css';

function App() {
  return (
    <Layout>
      <Slideshow interval={10000} />
      {/* Overlay content can go here if needed, but Slideshow is the main background/feature now */}
    </Layout>
  );
}

export default App;
