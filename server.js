const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const DB_FILE = path.join(__dirname, 'database.json');

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

// API: Get all articles
app.get('/api/articles', (req, res) => {
    const db = readDB();
    res.json(db.articles);
});

// API: Compatibility endpoint for UiPath RPA (Legacy /api/content)
app.post('/api/content', (req, res) => {
    const { title, summary, quality_score, status } = req.body;
    
    if (!title || !summary) {
        return res.status(400).json({ error: 'Title and summary are required' });
    }

    const db = readDB();
    const newArticle = {
        id: Date.now().toString(),
        title,
        raw_input: summary, // Mapping summary to raw_input for legacy compatibility
        summary: `AI Analyzed (Score: ${quality_score || 'N/A'})`,
        steps: ["RPA: Extracted content from file", "AI: Analyzed via GPT-4o"],
        tags: ["RPA-Import", "AI-Generated"],
        status: status || 'Draft',
        history: [{
            timestamp: new Date().toISOString(),
            action: 'Imported via legacy RPA endpoint',
            status: status || 'Draft'
        }]
    };

    db.articles.push(newArticle);
    writeDB(db);

    res.status(201).json({ success: true, message: 'Article created', article: newArticle });
});

// API: Download RPA Package
app.get('/api/rpa/download', (req, res) => {
    const file = path.join(__dirname, 'rpa', 'Main.xaml');
    res.download(file, 'DHL_Knowledge_Base_RPA.xaml');
});

// API: Create new article (RPA-ready)
app.post('/api/articles', (req, res) => {
    const { title, raw_input, summary, steps, tags, status } = req.body;
    
    if (!title || !raw_input) {
        return res.status(400).json({ error: 'Title and raw_input are required' });
    }

    const db = readDB();
    const newArticle = {
        id: Date.now().toString(),
        title,
        raw_input,
        summary: summary || '',
        steps: steps || [],
        tags: tags || [],
        status: status || 'Draft',
        history: [{
            timestamp: new Date().toISOString(),
            action: 'Created via RPA',
            status: status || 'Draft'
        }]
    };

    db.articles.push(newArticle);
    writeDB(db);

    res.status(201).json(newArticle);
});

// API: Update article status (Reviewer Dashboard)
app.put('/api/articles/:id', (req, res) => {
    const { id } = req.params;
    const { status, action_note } = req.body;

    if (!['Draft', 'Reviewed', 'Published'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const db = readDB();
    const articleIndex = db.articles.findIndex(a => a.id === id);

    if (articleIndex === -1) {
        return res.status(404).json({ error: 'Article not found' });
    }

    const article = db.articles[articleIndex];
    article.status = status;
    article.history.push({
        timestamp: new Date().toISOString(),
        action: action_note || `Status changed to ${status}`,
        status: status
    });

    writeDB(db);
    res.json(article);
});

// API: Delete article (Optional but useful)
app.delete('/api/articles/:id', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const initialLength = db.articles.length;
    db.articles = db.articles.filter(a => a.id !== id);
    
    if (db.articles.length === initialLength) {
        return res.status(404).json({ error: 'Article not found' });
    }

    writeDB(db);
    res.status(204).send();
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`DHL DAC 3.0 Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
