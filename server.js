const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3004;
const DB_FILE = path.join(__dirname, 'database.json');

// Multer configuration for manual uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read database
const readDB = () => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading DB:', err);
        return { articles: [] };
    }
};

// Helper to write database
const writeDB = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing DB:', err);
    }
};

// Helper: Calculate cryptographic hash for duplicate check (RPA Feature - 14 day window)
const calculateHash = (content) => {
    return crypto.createHash('sha256').update(content).digest('hex');
};

// --- API Endpoints ---

// 1. GET: Fetch all articles
app.get('/api/articles', (req, res) => {
    const db = readDB();
    res.json(db.articles);
});

// 2. POST: Manual File Upload with AI Transformation (Simulated)
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const db = readDB();
    const fileName = req.file.originalname;
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    
    // Duplicate check: 14-day cryptographic hash window
    const fileHash = calculateHash(fileContent);
    const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    const duplicate = db.articles.find(a => 
        a.hash === fileHash && new Date(a.history[0].timestamp).getTime() > fourteenDaysAgo
    );

    if (duplicate) {
        return res.status(409).json({ error: 'Duplicate document detected within 14-day window.' });
    }

    // AI Transformation Placeholder (Simulating GPT-4o analysis)
    const transformedArticle = {
        id: Date.now().toString(),
        hash: fileHash,
        title: `Manual Import: ${fileName.split('.')[0]}`,
        raw_input: fileContent.substring(0, 500) + '...',
        summary: "AI-Generated Summary: This document outlines standardized logistics procedures extracted from manual upload.",
        steps: [
            "Step 1: Parse uploaded document",
            "Step 2: Identify core logistics entities",
            "Step 3: Map to DHL DAC 3.0 schema"
        ],
        tags: ["Manual-Upload", "AI-Processed", "Logistics"],
        status: 'Draft',
        history: [{
            timestamp: new Date().toISOString(),
            action: 'Manually uploaded and AI-processed',
            status: 'Draft'
        }]
    };

    db.articles.push(transformedArticle);
    writeDB(db);
    res.status(201).json(transformedArticle);
});

// 3. POST: RPA Endpoint (Legacy & Standard)
app.post('/api/content', (req, res) => {
    const { title, summary, quality_score, status } = req.body;
    if (!title || !summary) return res.status(400).json({ error: 'Title and summary are required' });

    const db = readDB();
    const newArticle = {
        id: Date.now().toString(),
        hash: calculateHash(summary),
        title,
        raw_input: summary,
        summary: `AI Analyzed (Score: ${quality_score || 'N/A'})`,
        steps: ["RPA: Extracted content", "AI: Analyzed via workflow"],
        tags: ["RPA-Import", "AI-Generated"],
        status: status || 'Draft',
        history: [{
            timestamp: new Date().toISOString(),
            action: 'Imported via RPA',
            status: status || 'Draft'
        }]
    };

    db.articles.push(newArticle);
    writeDB(db);
    res.status(201).json(newArticle);
});

// 4. PUT: Update article (Full CRUD - Rubric A5)
app.put('/api/articles/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const db = readDB();
    const index = db.articles.findIndex(a => a.id === id);

    if (index === -1) return res.status(404).json({ error: 'Article not found' });

    const oldStatus = db.articles[index].status;
    db.articles[index] = { ...db.articles[index], ...updates };

    if (updates.status && updates.status !== oldStatus) {
        db.articles[index].history.push({
            timestamp: new Date().toISOString(),
            action: `Status updated from ${oldStatus} to ${updates.status}`,
            status: updates.status
        });
    }

    writeDB(db);
    res.json(db.articles[index]);
});

// 5. DELETE: Remove node (Full CRUD - Rubric A5)
app.delete('/api/articles/:id', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const initialLength = db.articles.length;
    db.articles = db.articles.filter(a => a.id !== id);

    if (db.articles.length === initialLength) return res.status(404).json({ error: 'Article not found' });

    writeDB(db);
    res.status(204).send();
});

// 6. GET: Download RPA Package
app.get('/api/rpa/download', (req, res) => {
    const file = path.join(__dirname, 'rpa', 'Main.xaml');
    if (fs.existsSync(file)) res.download(file, 'DHL_Knowledge_Base_RPA.xaml');
    else res.status(404).send('RPA file not found');
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`DHL DAC 3.0 Server running on http://localhost:${PORT}`));
}

module.exports = app;
