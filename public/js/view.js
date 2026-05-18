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
            toggleBtn: document.getElementById('toggleConnections'),
            // New Elements
            loginBtn: document.getElementById('loginBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            userProfile: document.getElementById('userProfile'),
            editorControls: document.getElementById('editorControls'),
            uploadModal: document.getElementById('uploadModal'),
            openUploadModal: document.getElementById('openUploadModal'),
            closeModal: document.querySelector('.modal-close'),
            dropZone: document.getElementById('dropZone'),
            fileInput: document.getElementById('fileInput'),
            uploadProgress: document.getElementById('uploadProgress'),
            progressFill: document.querySelector('.progress-fill'),
            uploadStatus: document.getElementById('uploadStatus'),
            conflictAlert: document.getElementById('conflictAlert'),
            alertClose: document.querySelector('.alert-close')
        };
        this.svgLayer = this.elements.svgLayer;
        this.initSVGCanvas();
    },
    
    initSVGCanvas() {
        this.svgLayer.setAttribute('width', window.innerWidth);
        this.svgLayer.setAttribute('height', window.innerHeight);
    },

    escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    },
    
    renderArticles(articles) {
        this.elements.grid.innerHTML = '';
        if (articles.length === 0) {
            this.elements.grid.innerHTML = '<div class="empty-state">No knowledge nodes match the current filters.</div>';
            return;
        }
        articles.forEach(article => this.renderCard(article));
    },
    
    renderCard(article) {
        const card = document.createElement('div');
        const status = this.escapeHTML(article.status || 'Draft');
        const tags = Array.isArray(article.tags) ? article.tags : [];
        card.className = `article-card ${article.status === 'Published' ? 'published-glow' : ''}`;
        card.dataset.id = article.id;
        card.innerHTML = `
            <span class="status-badge status-${status}">${status}</span>
            <h4>${this.escapeHTML(article.title)}</h4>
            <p>${this.escapeHTML(article.summary || 'No summary available.')}</p>
            <div class="tag-container">
                ${tags.map(tag => `<span class="tag">#${this.escapeHTML(tag)}</span>`).join('')}
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
    
    drawRouteLine(sourceEl, targetEl, style = 'curved') {
        const rect1 = sourceEl.getBoundingClientRect();
        const rect2 = targetEl.getBoundingClientRect();

        const x1 = rect1.left + rect1.width / 2 + window.scrollX;
        const y1 = rect1.top + rect1.height / 2 + window.scrollY;
        const x2 = rect2.left + rect2.width / 2 + window.scrollX;
        const y2 = rect2.top + rect2.height / 2 + window.scrollY;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        let pathD;
        if (style === 'ortho') {
            const horiz = Math.abs(x2 - x1) > Math.abs(y2 - y1);
            if (horiz) {
                const midX2 = midX;
                pathD = `M ${x1} ${y1} L ${midX2} ${y1} L ${midX2} ${y2} L ${x2} ${y2}`;
            } else {
                const midY2 = midY;
                pathD = `M ${x1} ${y1} L ${x1} ${midY2} L ${x2} ${midY2} L ${x2} ${y2}`;
            }
        } else {
            const controlOffset = 30;
            const dx = x2 - x1;
            const ctrlX1 = x1 + dx * 0.25;
            const ctrlY1 = y1 + (Math.random() > 0.5 ? controlOffset : -controlOffset);
            const ctrlX2 = x1 + dx * 0.75;
            const ctrlY2 = y2 + (Math.random() > 0.5 ? -controlOffset : controlOffset);
            pathD = `M ${x1} ${y1} C ${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${x2} ${y2}`;
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('class', `route-line ${style === 'ortho' ? 'ortho' : ''}`);
        path.setAttribute('fill', 'none');
        this.svgLayer.appendChild(path);

        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', midX);
        dot.setAttribute('cy', midY);
        dot.setAttribute('r', '4');
        dot.setAttribute('class', 'route-node');
        this.svgLayer.appendChild(dot);
    },
    
    showFocusView(article, userRole) {
        this.focusMode = true;
        document.body.classList.add('focus-mode-active');
        
        const overlay = document.createElement('div');
        overlay.id = 'focusOverlay';
        overlay.innerHTML = this.createFocusViewHTML(article, userRole);
        document.body.appendChild(overlay);
        
        requestAnimationFrame(() => {
            overlay.classList.add('active');
            Presenter.drawFocusConnections();
        });
        
        overlay.querySelector('.focus-close').onclick = () => Presenter.closeFocusView();
        overlay.querySelector('.focus-backdrop').onclick = () => Presenter.closeFocusView();
        
        if (userRole === 'Editor') {
            const statusDropdown = overlay.querySelector('#focusStatusDropdown');
            statusDropdown.onchange = () => Presenter.onStatusButtonClick(statusDropdown.value);
            
            const deleteBtn = overlay.querySelector('#deleteArticleBtn');
            deleteBtn.onclick = () => {
                if (confirm('Are you sure you want to delete this intelligence node?')) {
                    Presenter.onDeleteArticle(article.id);
                }
            };
        }
    },
    
    createFocusViewHTML(article, userRole) {
        const isEditor = userRole === 'Editor';
        const status = this.escapeHTML(article.status || 'Draft');
        const tags = Array.isArray(article.tags) ? article.tags : [];
        const steps = Array.isArray(article.steps) ? article.steps : [];
        const history = Array.isArray(article.history) ? article.history : [];
        return `
            <div class="focus-backdrop"></div>
            <div class="focus-container">
                <button class="focus-close">&times;</button>
                <div class="focus-main-card">
                    <span class="status-badge status-${status}">${status}</span>
                    <h2>${this.escapeHTML(article.title)}</h2>
                    <div class="focus-raw-input">${this.escapeHTML(article.raw_input || '')}</div>
                    <div class="focus-summary">${this.escapeHTML(article.summary || '')}</div>
                    <div class="focus-tags">
                        ${tags.map(t => `<span class="tag">#${this.escapeHTML(t)}</span>`).join('')}
                    </div>
                </div>
                <div class="focus-steps-container">
                    <h3>RPA Process Steps</h3>
                    <div class="steps-nodes">
                        ${steps.map((step, i) => `
                            <div class="step-node" data-step="${i + 1}">
                                <div class="step-number">${i + 1}</div>
                                <div class="step-label">${this.escapeHTML(step)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="focus-history">
                    <h3>Version History</h3>
                    <ul>
                        ${history.map(h => `
                            <li>
                                <span class="history-time">${new Date(h.timestamp).toLocaleString()}</span>
                                <span class="history-action">${this.escapeHTML(h.action)}</span>
                                <span class="status-badge status-${this.escapeHTML(h.status)}">${this.escapeHTML(h.status)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="focus-actions">
                    ${isEditor ? `
                        <div class="editor-actions">
                            <div class="status-selector">
                                <label for="focusStatusDropdown">Update Status</label>
                                <select id="focusStatusDropdown">
                                    <option value="Draft" ${article.status === 'Draft' ? 'selected' : ''}>Draft</option>
                                    <option value="Reviewed" ${article.status === 'Reviewed' ? 'selected' : ''}>Reviewed</option>
                                    <option value="Published" ${article.status === 'Published' ? 'selected' : ''}>Published</option>
                                </select>
                            </div>
                            <button id="deleteArticleBtn" class="dhl-btn delete-btn">Delete Node</button>
                        </div>
                    ` : `
                        <p class="viewer-note">Viewing as Guest. Login to modify.</p>
                    `}
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
    
    updateAuthUI(role) {
        if (role === 'Editor') {
            this.elements.loginBtn.classList.add('hidden');
            this.elements.userProfile.classList.remove('hidden');
            this.elements.editorControls.classList.remove('hidden');
        } else {
            this.elements.loginBtn.classList.remove('hidden');
            this.elements.userProfile.classList.add('hidden');
            this.elements.editorControls.classList.add('hidden');
        }
    },
    
    showConflictAlert(conflicts) {
        if (conflicts.length > 0) {
            const message = `Warning: Potential conflict with existing SOP detected (${conflicts[0].title}). Shared tags >= 2.`;
            this.elements.conflictAlert.querySelector('.alert-message').textContent = message;
            this.elements.conflictAlert.classList.remove('hidden');
        }
    },
    
    hideConflictAlert() {
        this.elements.conflictAlert.classList.add('hidden');
    },
    
    showUploadModal() {
        this.elements.uploadModal.classList.remove('hidden');
        this.elements.uploadStatus.innerHTML = '';
        this.elements.uploadProgress.classList.add('hidden');
    },
    
    hideUploadModal() {
        this.elements.uploadModal.classList.add('hidden');
    },
    
    updateUploadProgress(percent) {
        this.elements.uploadProgress.classList.remove('hidden');
        this.elements.progressFill.style.width = `${percent}%`;
    },
    
    showUploadStatus(message, type) {
        this.elements.uploadStatus.innerHTML = `<span class="status-${type}">${message}</span>`;
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
        
        // Auth events
        this.elements.loginBtn.onclick = () => presenter.onLogin();
        this.elements.logoutBtn.onclick = () => presenter.onLogout();
        
        // Upload events
        this.elements.openUploadModal.onclick = () => this.showUploadModal();
        this.elements.closeModal.onclick = () => this.hideUploadModal();
        this.elements.alertClose.onclick = () => this.hideConflictAlert();
        
        this.elements.dropZone.onclick = () => this.elements.fileInput.click();
        this.elements.fileInput.onchange = (e) => presenter.onFileUpload(e.target.files[0]);
        
        this.elements.dropZone.ondragover = (e) => { e.preventDefault(); this.elements.dropZone.classList.add('dragover'); };
        this.elements.dropZone.ondragleave = () => this.elements.dropZone.classList.remove('dragover');
        this.elements.dropZone.ondrop = (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.remove('dragover');
            presenter.onFileUpload(e.dataTransfer.files[0]);
        };

        window.addEventListener('resize', () => {
            if (this.focusMode) {
                this.clearSVG();
                presenter.redrawFocusConnections();
            }
        });
    }
};
