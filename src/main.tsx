import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/product.css';
import './styles/content.css';
import './styles/navigation.css';
import './styles/typography.css';
import './styles/result.css';
import './styles/brand.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Could not find the application root element.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);