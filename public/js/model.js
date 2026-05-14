const API_BASE = '/api';

const Model = {
    articles: [],
    
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
    
    async createArticle(data) {
        try {
            const response = await fetch(`${API_BASE}/articles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to create article');
            const newArticle = await response.json();
            this.articles.push(newArticle);
            return newArticle;
        } catch (err) {
            console.error('Model create error:', err);
            return null;
        }
    },
    
    async updateArticleStatus(id, status) {
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
            return null;
        }
    },
    
    async deleteArticle(id) {
        try {
            const response = await fetch(`${API_BASE}/articles/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete article');
            this.articles = this.articles.filter(a => a.id !== id);
            return true;
        } catch (err) {
            console.error('Model delete error:', err);
            return false;
        }
    },
    
    getById(id) {
        return this.articles.find(a => a.id === id);
    },
    
    getByStatus(status) {
        if (status === 'all') return this.articles;
        return this.articles.filter(a => a.status === status);
    },
    
    getByTag(tag) {
        if (!tag) return this.articles;
        return this.articles.filter(a => a.tags.includes(tag));
    },
    
    getRelated(article) {
        return this.articles.filter(a => 
            a.id !== article.id && 
            a.tags.some(tag => article.tags.includes(tag))
        );
    },
    
    getAllTags() {
        return [...new Set(this.articles.flatMap(a => a.tags))];
    }
};
