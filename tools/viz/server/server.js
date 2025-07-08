// Minimal dev proxy for CORS and static serving
// Usage: node server.js
// Visit: http://localhost:8001 for the React app

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const serveIndex = require('serve-index');
const fs = require('fs');
const { execFile } = require('child_process');

const app = express();
const PORT = 8001;
const TARGET = 'https://djibouti.tekdinext.com';

// CORS for local dev
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Proxy API requests
app.use('/api', createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${TARGET}${req.originalUrl.replace(/^\/api/, '')}`);
    },
    onError: (err, req, res) => {
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}));

// Serve the built Vite app from Docker container
const reactAppPath = path.join(__dirname, 'public/app');
console.log('Looking for React app at:', reactAppPath);

// Check if React app is built and exists
if (fs.existsSync(reactAppPath)) {
    console.log('✅ React app found - serving from public/app');

    // Serve static assets (CSS, JS, images, etc.)
    app.use(express.static(reactAppPath));

} else {
    console.log('⚠️  React app not built yet - serving fallback');
    console.log('   Build path expected:', reactAppPath);

    // Fallback: serve static files from current directory for old files
    app.use(express.static(path.join(__dirname)));
}

// Serve /data directory for config and reference files with directory listing
const dataPath = path.join(__dirname, '../../../data');
console.log('Data path:', dataPath);
app.use('/data', express.static(dataPath), serveIndex(dataPath, { icons: true }));

// API: /api-local/data-tree - returns a JSON tree of the /data directory
app.get('/api-local/data-tree', async (req, res) => {
    const dataRoot = path.join(__dirname, '../../../data');
    const exts = ['.json', '.yaml', '.yml'];
    function walk(dir, relPath = '/data') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const result = [];
        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue; // skip hidden
            const abs = path.join(dir, entry.name);
            const rel = path.posix.join(relPath, entry.name);
            if (entry.isDirectory()) {
                const children = walk(abs, rel);
                if (children.length > 0) {
                    result.push({ name: entry.name, path: rel + '/', type: 'folder', children });
                }
            } else if (exts.some(ext => entry.name.toLowerCase().endsWith(ext))) {
                result.push({ name: entry.name, path: rel, type: 'file' });
            }
        }
        return result;
    }
    try {
        const tree = walk(dataRoot);
        res.json(tree);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: /api-local/recently-changed-configs - returns recently changed config files
app.get('/api-local/recently-changed-configs', (req, res) => {
    const days = parseInt(req.query.days, 10) || 7;
    const exts = ['.json', '.yaml', '.yml'];
    const scriptPath = path.join(__dirname, '../../scripts/git_changes.py');
    const cachePath = path.join('/app', 'git_changes_cache.txt');
    const repoRoot = path.join(__dirname, '../../../');

    function parseGitOutput(stdout) {
        const lines = stdout.split('\n');
        const files = [];
        let inTable = false;
        for (const line of lines) {
            if (line.startsWith('File')) { inTable = true; continue; }
            if (inTable && line.startsWith('-')) continue;
            if (inTable && line.trim() && !line.startsWith('-')) {
                const parts = line.trim().split(/\s+/);
                const file = parts[0];
                if (exts.some(ext => file.toLowerCase().endsWith(ext))) {
                    files.push({ name: path.basename(file), path: '/' + file.replace(/^[./]+/, '') });
                }
            }
        }
        return files;
    }

    // Try to run the script
    execFile(scriptPath, [days], { cwd: repoRoot }, (err, stdout, stderr) => {
        if (!err && stdout) {
            return res.json(parseGitOutput(stdout));
        }
        // Fallback to cache
        fs.readFile(cachePath, 'utf8', (cacheErr, cacheData) => {
            if (!cacheErr && cacheData) {
                return res.json(parseGitOutput(cacheData));
            }
            // If both fail, return error
            res.status(500).json({ error: stderr || err?.message || cacheErr?.message || 'Unable to get changed configs' });
        });
    });
});

// Handle SPA routing - serve index.html for non-API, non-data routes
app.get('*', (req, res, next) => {
    // Skip if it's an API, data, or file request
    if (req.path.startsWith('/api') ||
        req.path.startsWith('/data') ||
        req.path.startsWith('/api-local') ||
        req.path.includes('.')) {
        return next();
    }

    // Serve the React app's index.html for SPA routing
    const indexPath = path.join(__dirname, 'public/app', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('App not found - build the React app first');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running: http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/`);
    console.log(`📁 Data browser: http://localhost:${PORT}/data`);
}); 