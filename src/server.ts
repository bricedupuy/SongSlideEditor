import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url'; // Needed for ES Modules to get __dirname

// Helper to get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Use the PORT environment variable if available, otherwise default to 3000
// Dokploy will likely set this variable for you.
const port = process.env.PORT || 3000;

// Serve static files from the 'dist' directory
// path.join(__dirname, '..', 'dist') correctly points to the 'dist' folder
// which is one level up from 'src'
app.use(express.static(path.join(__dirname, '..', 'dist')));

// This is crucial for Single-Page Applications (SPAs).
// If a user refreshes the page on a route like /about, or types it directly,
// the server needs to send back index.html so your client-side router can handle it.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
  console.log(`Serving static files from: ${path.join(__dirname, '..', 'dist')}`);
});