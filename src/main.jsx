import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './wellness.css';
import './program/program.css';
import './training.css';
import './history.css';
import './navigation.css';

createRoot(document.getElementById('root')).render(<App />);
