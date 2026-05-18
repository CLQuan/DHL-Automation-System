const Presenter = {
    showConnections: true,
    activeTagFilter: null,
    statusFilter: 'all',
    currentFocusArticle: null,
    
    init() {
        View.init();
        View.bindEvents(this);
        this.updateAuthView();
        this.loadInitialData();
    },
    
    async loadInitialData() {
        await Model.fetchAll();
        this.refreshView();
    },
    
    refreshView() {
        const visibleArticles = Model.getVisibleArticles(this.statusFilter);
        View.updateTotalCount(visibleArticles.length);
        View.updateToggleButton(this.showConnections);
        View.renderTagFilters(Model.getAllTags(), this.activeTagFilter);
        this.renderFilteredArticles();
    },
    
    renderFilteredArticles() {
        let filtered = Model.getVisibleArticles(this.statusFilter);
        if (this.activeTagFilter) {
            filtered = filtered.filter(a => Array.isArray(a.tags) && a.tags.includes(this.activeTagFilter));
        }
        View.renderArticles(filtered);
        this.attachCardEvents();
    },
    
    attachCardEvents() {
        document.querySelectorAll('.article-card').forEach(card => {
            const id = card.dataset.id;
            const article = Model.getById(id);
            
            card.addEventListener('mouseenter', () => this.onCardHover(article));
            card.addEventListener('mouseleave', () => this.onCardLeave());
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onCardClick(article);
            });
        });
    },
    
    onCardHover(article) {
        if (!this.showConnections) return;
        this.drawConnections(article);
    },
    
    onCardLeave() {
        View.clearSVG();
        View.clearAllHighlights();
    },
    
    drawConnections(activeArticle) {
        View.clearSVG();
        View.clearAllHighlights();

        const activeCard = View.getCardById(activeArticle.id);
        if (activeCard) View.highlightCard(activeCard);

        const related = Model.getRelated(activeArticle);
        related.forEach(rel => {
            const relCard = View.getCardById(rel.id);
            if (relCard) {
                View.highlightCard(relCard);
                View.drawRouteLine(activeCard, relCard, 'ortho');
            }
        });
    },
    
    onCardClick(article) {
        this.currentFocusArticle = article;
        View.showFocusView(article, Model.userRole);
    },
    
    drawFocusConnections() {
        View.clearSVG();
        const { mainCard, stepNodes } = View.getFocusElements();
        if (!mainCard || stepNodes.length === 0) return;
        stepNodes.forEach(node => View.drawStepConnection(mainCard, node));
    },
    
    redrawFocusConnections() {
        if (this.currentFocusArticle) {
            this.drawFocusConnections();
        }
    },
    
    closeFocusView() {
        this.currentFocusArticle = null;
        View.hideFocusView();
        View.clearSVG();
        this.renderFilteredArticles();
    },
    
    async onStatusButtonClick(newStatus) {
        if (!this.currentFocusArticle) return;
        
        try {
            const updated = await Model.updateArticleStatus(this.currentFocusArticle.id, newStatus);
            if (updated) {
                await Model.fetchAll();
                this.refreshView();
                this.closeFocusView();
            }
        } catch (err) {
            alert(err.message);
        }
    },
    
    async onDeleteArticle(id) {
        try {
            const success = await Model.deleteArticle(id);
            if (success) {
                this.closeFocusView();
                this.refreshView();
            }
        } catch (err) {
            alert(err.message);
        }
    },
    
    async onFileUpload(file) {
        if (!file) return;
        
        View.updateUploadProgress(30);
        try {
            const newArticle = await Model.uploadFile(file);
            View.updateUploadProgress(100);
            View.showUploadStatus('AI Transformation Complete!', 'success');
            
            // Check for conflicts
            const conflicts = Model.checkConflicts(newArticle.tags);
            View.showConflictAlert(conflicts);
            
            setTimeout(() => {
                View.hideUploadModal();
                this.refreshView();
            }, 1500);
        } catch (err) {
            View.showUploadStatus(err.message, 'error');
            View.updateUploadProgress(0);
        }
    },
    
    onLogin() {
        Model.loginAsEditor();
        this.updateAuthView();
        this.refreshView();
    },
    
    onLogout() {
        Model.logout();
        this.updateAuthView();
        this.refreshView();
    },
    
    updateAuthView() {
        View.updateAuthUI(Model.userRole);
    },
    
    onStatusFilterChange(status) {
        this.statusFilter = status;
        this.renderFilteredArticles();
    },
    
    onTagFilterChange(tag) {
        this.activeTagFilter = tag;
        View.renderTagFilters(Model.getAllTags(), tag);
        this.renderFilteredArticles();
    },
    
    onToggleConnections() {
        this.showConnections = !this.showConnections;
        View.updateToggleButton(this.showConnections);
        if (!this.showConnections) {
            View.clearSVG();
            View.clearAllHighlights();
        }
    }
};
