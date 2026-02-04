import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing: return index.html for any unknown route
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    console.log(`Serving request: ${req.url} -> ${indexPath}`);
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("Error sending index.html:", err);
            res.status(500).send("Error loading application.");
        }
    });
});

app.listen(port, () => {
    console.log(`Frontend server running on port ${port}`);
});
