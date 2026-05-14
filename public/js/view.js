const View = {
    elements: {},
    svgLayer: null,
    focusMode: false,
    
    init() {
        this.elements = {
            grid: document.getElementById('articlesGrid'),
            svgLayer: document.getElementById('connectionsLayer'),
            statusFilter: document.getElementById('statusFilter'),
            tagFilters: document.getElementById('tagFilters'),
            totalCount: document.getElementById('totalCount'),
            toggleBtn: document.getElementById('toggleConnections')
        };
        this.svgLayer = this.elements.svgLayer;
        this.initSVGCanvas();
    },
    
    initSVGCanvas() {
        this.svgLayer.setAttribute('width', window.innerWidth);
        this.svgLayer.setAttribute('height', window.innerHeight);
    },
    
    renderArticles(articles) {
        this.elements.grid.innerHTML = '';
        articles.forEach(article => this.renderCard(article));
    },
    
    renderCard(article) {
        const card = document.createElement('div');
        card.className = `article-card ${article.status === 'Published' ? 'published-glow' : ''}`;
        card.dataset.id = article.id;
        card.innerHTML = `
            <span class="status-badge status-${article.status}">${article.status}</span>
            <h4>${article.title}</h4>
            <p>${article.summary || 'No summary available.'}</p>
            <div class="tag-container">
                ${article.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
            </div>
        `;
        this.elements.grid.appendChild(card);
        return card;
    },
    
    renderTagFilters(tags, activeTag) {
        this.elements.tagFilters.innerHTML = '';
        
        const allBtn = this.createTagElement('All Tags', !activeTag);
        allBtn.onclick = () => Presenter.onTagFilterChange(null);
        this.elements.tagFilters.appendChild(allBtn);

        tags.forEach(tag => {
            const tagBtn = this.createTagElement(`#${tag}`, activeTag === tag);
            tagBtn.onclick = () => Presenter.onTagFilterChange(tag);
            this.elements.tagFilters.appendChild(tagBtn);
        });
    },
    
    createTagElement(text, isActive) {
        const el = document.createElement('span');
        el.className = `tag ${isActive ? 'active' : ''}`;
        el.textContent = text;
        return el;
    },
    
    updateTotalCount(count) {
        this.elements.totalCount.textContent = count;
    },
    
    updateToggleButton(showConnections) {
        this.elements.toggleBtn.textContent = showConnections ? 'Disable Connections' : 'Enable Connections';
    },
    
    highlightCard(cardEl) {
        if (cardEl) cardEl.classList.add('highlighted');
    },
    
    unhighlightCard(cardEl) {
        if (cardEl) cardEl.classList.remove('highlighted');
    },
    
    clearAllHighlights() {
        document.querySelectorAll('.article-card').forEach(c => c.classList.remove('highlighted'));
    },
    
    getCardById(id) {
        return document.querySelector(`.article-card[data-id="${id}"]`);
    },
    
    clearSVG() {
        this.svgLayer.innerHTML = '';
    },
    
    drawRouteLine(sourceEl, targetEl) {
        const rect1 = sourceEl.getBoundingClientRect();
        const rect2 = targetEl.getBoundingClientRect();

        const x1 = rect1.left + rect1.width / 2 + window.scrollX;
        const y1 = rect1.top + rect1.height / 2 + window.scrollY;
        const x2 = rect2.left + rect2.width / 2 + window.scrollX;
        const y2 = rect2.top + rect2.height / 2 + window.scrollY;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        const controlOffset = 30;
        const dx = x2 - x1;
        const ctrlX1 = x1 + dx * 0.25;
        const ctrlY1 = y1 + (Math.random() > 0.5 ? controlOffset : -controlOffset);
        const ctrlX2 = x1 + dx * 0.75;
        const ctrlY2 = y2 + (Math.random() > 0.5 ? -controlOffset : controlOffset);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} C ${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${x2} ${y2}`);
        path.setAttribute('class', 'route-line');
        path.setAttribute('fill', 'none');
        this.svgLayer.appendChild(path);
        
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', midX);
        dot.setAttribute('cy', midY);
        dot.setAttribute('r', '4');
        dot.setAttribute('class', 'route-node');
        this.svgLayer.appendChild(dot);
    },
    
    showFocusView(article) {
        this.focusMode = true;
        document.body.classList.add('focus-mode-active');
        
        const overlay = document.createElement('div');
        overlay.id = 'focusOverlay';
        overlay.innerHTML = this.createFocusViewHTML(article);
        document.body.appendChild(overlay);
        
        requestAnimationFrame(() => {
            overlay.classList.add('active');
            Presenter.drawFocusConnections();
        });
        
        overlay.querySelector('.focus-close').onclick = () => Presenter.closeFocusView();
        overlay.querySelector('.focus-backdrop').onclick = () => Presenter.closeFocusView();
        overlay.querySelectorAll('.status-btn').forEach(btn => {
            btn.onclick = () => Presenter.onStatusButtonClick(btn.dataset.status);
        });
    },
    
    createFocusViewHTML(article) {
        return `
            <div class="focus-backdrop"></div>
            <div class="focus-container">
                <button class="focus-close">&times;</button>
                <div class="focus-main-card">
                    <span class="status-badge status-${article.status}">${article.status}</span>
                    <h2>${article.title}</h2>
                    <div class="focus-raw-input">${article.raw_input}</div>
                    <div class="focus-summary">${article.summary}</div>
                    <div class="focus-tags">
                        ${article.tags.map(t => `<span class="tag">#${t}</span>`).join('')}
                    </div>
                </div>
                <div class="focus-steps-container">
                    <h3>RPA Process Steps</h3>
                    <div class="steps-nodes">
                        ${article.steps.map((step, i) => `
                            <div class="step-node" data-step="${i + 1}">
                                <div class="step-number">${i + 1}</div>
                                <div class="step-label">${step}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="focus-history">
                    <h3>Version History</h3>
                    <ul>
                        ${article.history.map(h => `
                            <li>
                                <span class="history-time">${new Date(h.timestamp).toLocaleString()}</span>
                                <span class="history-action">${h.action}</span>
                                <span class="status-badge status-${h.status}">${h.status}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="focus-actions">
                    <button class="status-btn draft" data-status="Draft">Set to Draft</button>
                    <button class="status-btn reviewed" data-status="Reviewed">Mark Reviewed</button>
                    <button class="status-btn published" data-status="Published">Publish</button>
                </div>
            </div>
        `;
    },
    
    hideFocusView() {
        const overlay = document.getElementById('focusOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }
        document.body.classList.remove('focus-mode-active');
        this.focusMode = false;
    },
    
    drawStepConnection(mainCard, stepNode) {
        const mainRect = mainCard.getBoundingClientRect();
        const stepRect = stepNode.getBoundingClientRect();
        
        const x1 = mainRect.left + mainRect.width / 2;
        const y1 = mainRect.top + mainRect.height / 2;
        const x2 = stepRect.left + stepRect.width / 2;
        const y2 = stepRect.top + stepRect.height / 2;
        
        const ctrlY1 = y1 + (y2 > y1 ? 40 : -40);
        const ctrlY2 = y2 + (y2 > y1 ? -40 : 40);
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} C ${x1} ${ctrlY1}, ${x2} ${ctrlY2}, ${x2} ${y2}`);
        path.setAttribute('class', 'step-connection-line');
        path.setAttribute('fill', 'none');
        this.svgLayer.appendChild(path);
    },
    
    getFocusElements() {
        return {
            container: document.querySelector('.focus-container'),
            mainCard: document.querySelector('.focus-main-card'),
            stepNodes: document.querySelectorAll('.step-node')
        };
    },
    
    bindEvents(presenter) {
        this.elements.statusFilter.addEventListener('change', () => presenter.onStatusFilterChange(this.elements.statusFilter.value));
        this.elements.toggleBtn.addEventListener('click', () => presenter.onToggleConnections());
        window.addEventListener('resize', () => {
            if (this.focusMode) {
                this.clearSVG();
                presenter.redrawFocusConnections();
            }
        });
    }
};
