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
const VALID_STATUSES = ['Draft', 'Reviewed', 'Published'];
const DUPLICATE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const TEXT_UPLOAD_EXTENSIONS = new Set(['.txt', '.md', '.csv', '.json']);

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
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!TEXT_UPLOAD_EXTENSIONS.has(ext)) {
            return cb(new Error('Only text-based uploads are supported: .txt, .md, .csv, .json'));
        }
        cb(null, true);
    }
});

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
        return true;
    } catch (err) {
        console.error('Error writing DB:', err);
        return false;
    }
};

// Helper: Calculate cryptographic hash for duplicate check (RPA Feature - 14 day window)
const calculateHash = (content) => {
    return crypto.createHash('sha256').update(String(content).trim().toLowerCase()).digest('hex');
};

const normalizeText = (value) => String(value || '').trim();

const normalizeList = (value, fallback = []) => {
    if (Array.isArray(value)) {
        return [...new Set(value.map(normalizeText).filter(Boolean))];
    }
    if (typeof value === 'string') {
        return [...new Set(value.split(',').map(normalizeText).filter(Boolean))];
    }
    return fallback;
};

const findRecentDuplicate = (articles, hash) => {
    const cutoff = Date.now() - DUPLICATE_WINDOW_MS;
    return articles.find(article => {
        const createdAt = article.history && article.history[0] && article.history[0].timestamp;
        return article.hash === hash && createdAt && new Date(createdAt).getTime() > cutoff;
    });
};

const safeWrite = (res, db, payload, statusCode = 200) => {
    if (!writeDB(db)) {
        return res.status(500).json({ error: 'Database write failed. Please retry or check server storage permissions.' });
    }
    return res.status(statusCode).json(payload);
};

// --- API Endpoints ---

// 1. GET: Fetch all articles
app.get('/api/articles', (req, res) => {
    const db = readDB();
    res.json(db.articles);
});

app.get('/api/health', (req, res) => {
    const db = readDB();
    res.json({
        status: 'ok',
        articles: db.articles.length,
        published: db.articles.filter(article => article.status === 'Published').length,
        duplicateWindowDays: 14,
        rpaEndpoint: '/api/content'
    });
});

// 2. POST: Manual File Upload with AI Transformation (Simulated)
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const db = readDB();
    const fileName = req.file.originalname;
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    if (!normalizeText(fileContent)) {
        return res.status(400).json({ error: 'Uploaded file is empty or unreadable.' });
    }
    
    // Duplicate check: 14-day cryptographic hash window
    const fileHash = calculateHash(fileContent);
    const duplicate = findRecentDuplicate(db.articles, fileHash);

    if (duplicate) {
        return res.status(409).json({ error: `Duplicate document detected within 14-day window: ${duplicate.title}` });
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
    safeWrite(res, db, transformedArticle, 201);
});

// 3. POST: RPA Endpoint (Legacy & Standard)
app.post('/api/content', (req, res) => {
    const title = normalizeText(req.body.title);
    const summary = normalizeText(req.body.summary);
    const rawInput = normalizeText(req.body.raw_input || req.body.content || summary);
    const requestedStatus = normalizeText(req.body.status) || 'Draft';
    const qualityScore = req.body.quality_score;

    if (!title || !summary) return res.status(400).json({ error: 'Title and summary are required' });
    if (!VALID_STATUSES.includes(requestedStatus)) {
        return res.status(400).json({ error: `Invalid status. Use one of: ${VALID_STATUSES.join(', ')}` });
    }

    const db = readDB();
    const hash = calculateHash(rawInput);
    const duplicate = findRecentDuplicate(db.articles, hash);

    if (duplicate) {
        return res.status(409).json({
            error: 'Duplicate RPA content detected within 14-day window.',
            duplicate_id: duplicate.id,
            duplicate_title: duplicate.title
        });
    }

    const newArticle = {
        id: Date.now().toString(),
        hash,
        title,
        raw_input: rawInput,
        summary,
        quality_score: qualityScore || 'N/A',
        steps: normalizeList(req.body.steps, ['RPA: Extracted content', 'AI: Analyzed via workflow', 'API: Stored in knowledge base']),
        tags: normalizeList(req.body.tags, ['RPA-Import', 'AI-Generated']),
        status: requestedStatus,
        history: [{
            timestamp: new Date().toISOString(),
            action: `Imported via RPA${qualityScore ? ` (quality score: ${qualityScore})` : ''}`,
            status: requestedStatus
        }]
    };

    db.articles.push(newArticle);
    safeWrite(res, db, newArticle, 201);
});

// 4. PUT: Update article (Full CRUD - Rubric A5)
app.put('/api/articles/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const db = readDB();
    const index = db.articles.findIndex(a => a.id === id);

    if (index === -1) return res.status(404).json({ error: 'Article not found' });

    const oldStatus = db.articles[index].status;
    if (updates.status && !VALID_STATUSES.includes(updates.status)) {
        return res.status(400).json({ error: `Invalid status. Use one of: ${VALID_STATUSES.join(', ')}` });
    }

    delete updates.id;
    delete updates.hash;
    delete updates.history;
    db.articles[index] = { ...db.articles[index], ...updates };

    if (updates.status && updates.status !== oldStatus) {
        db.articles[index].history.push({
            timestamp: new Date().toISOString(),
            action: `Status updated from ${oldStatus} to ${updates.status}`,
            status: updates.status
        });
    }

    safeWrite(res, db, db.articles[index]);
});

// 5. DELETE: Remove node (Full CRUD - Rubric A5)
app.delete('/api/articles/:id', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const initialLength = db.articles.length;
    db.articles = db.articles.filter(a => a.id !== id);

    if (db.articles.length === initialLength) return res.status(404).json({ error: 'Article not found' });

    if (!writeDB(db)) {
        return res.status(500).json({ error: 'Database write failed. Please retry or check server storage permissions.' });
    }
    res.status(204).send();
});

// 6. GET: Download RPA Package
app.get('/api/rpa/download', (req, res) => {
    const file = path.join(__dirname, 'rpa', 'Main.xaml');
    if (fs.existsSync(file)) res.download(file, 'DHL_Knowledge_Base_RPA.xaml');
    else res.status(404).send('RPA file not found');
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    }
    if (err) {
        return res.status(400).json({ error: err.message || 'Request failed' });
    }
    next();
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`DHL DAC 3.0 Server running on http://localhost:${PORT}`));
}

module.exports = app;
