const API_BASE = '/api';

const Model = {
    articles: [],
    userRole: localStorage.getItem('dhl_user_role') || 'Guest', // Default role
    
    async fetchAll() {
        try {
            const response = await fetch(`${API_BASE}/articles`);
            if (!response.ok) throw new Error('Failed to fetch articles');
            this.articles = await response.json();
            return this.articles;
        } catch (err) {
            console.error('Model fetch error:', err);
            return [];
        }
    },
    
    async uploadFile(file) {
        const allowedExtensions = ['.txt', '.md', '.csv', '.json'];
        const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            throw new Error('Only text-based uploads are supported: .txt, .md, .csv, .json');
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Upload failed');
            }
            
            const newArticle = await response.json();
            this.articles.push(newArticle);
            return newArticle;
        } catch (err) {
            console.error('Model upload error:', err);
            throw err;
        }
    },
    
    async updateArticleStatus(id, status) {
        if (this.userRole !== 'Editor') {
            throw new Error('Access Denied: Only Editors can update status.');
        }

        try {
            const response = await fetch(`${API_BASE}/articles/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!response.ok) throw new Error('Failed to update article');
            const updated = await response.json();
            const index = this.articles.findIndex(a => a.id === id);
            if (index !== -1) this.articles[index] = updated;
            return updated;
        } catch (err) {
            console.error('Model update error:', err);
            throw err;
        }
    },
    
    async deleteArticle(id) {
        if (this.userRole !== 'Editor') {
            throw new Error('Access Denied: Only Editors can delete nodes.');
        }

        try {
            const response = await fetch(`${API_BASE}/articles/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete article');
            this.articles = this.articles.filter(a => a.id !== id);
            return true;
        } catch (err) {
            console.error('Model delete error:', err);
            throw err;
        }
    },
    
    loginAsEditor() {
        this.userRole = 'Editor';
        localStorage.setItem('dhl_user_role', 'Editor');
    },
    
    logout() {
        this.userRole = 'Guest';
        localStorage.setItem('dhl_user_role', 'Guest');
    },
    
    getById(id) {
        return this.articles.find(a => a.id === id);
    },
    
    getVisibleArticles(statusFilter = 'all') {
        // Guest users only see Published articles
        if (this.userRole !== 'Editor') {
            return this.articles.filter(a => a.status === 'Published');
        }
        
        // Editors see based on filter
        if (statusFilter === 'all') return this.articles;
        return this.articles.filter(a => a.status === statusFilter);
    },
    
    getRelated(article) {
        const articleTags = Array.isArray(article.tags) ? article.tags : [];
        return this.articles.filter(a => 
            a.id !== article.id && 
            Array.isArray(a.tags) &&
            a.tags.some(tag => articleTags.includes(tag))
        );
    },
    
    checkConflicts(tags) {
        // Scenario 1 & Bonus 5.3: Check if new draft shares > 2 tags with existing Published articles
        const published = this.articles.filter(a => a.status === 'Published');
        return published.filter(p => {
            const publishedTags = Array.isArray(p.tags) ? p.tags : [];
            const inputTags = Array.isArray(tags) ? tags : [];
            const sharedTags = publishedTags.filter(t => inputTags.includes(t));
            return sharedTags.length >= 2;
        });
    },
    
    getAllTags() {
        const visible = this.getVisibleArticles();
        return [...new Set(visible.flatMap(a => Array.isArray(a.tags) ? a.tags : []))];
    }
};
