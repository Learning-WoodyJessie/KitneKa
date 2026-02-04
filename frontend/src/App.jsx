import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import SearchInterface from './components/SearchInterface';
import ProductPage from './components/ProductPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={
          <Layout>
            <SearchInterface />
          </Layout>
        } />
        <Route path="/product/:id" element={
          <Layout>
            <ProductPage />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
