import React from 'react';
import ReactDOM from 'react-dom/client';

// import your component file (adjust the name/path if different)
import SongSlideEditor from './SongSlideEditor';

// (optional) global styles; if you’re using Tailwind, keep this
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SongSlideEditor />
  </React.StrictMode>
);
