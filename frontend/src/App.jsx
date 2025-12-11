import React from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import SearchInterface from './components/SearchInterface';
import ProductPage from './components/ProductPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchInterface />} />
          <Route path="/product/:id" element={<ProductPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
