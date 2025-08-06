// AutoDraw UI Component
class AutoDrawUI {
    constructor(container) {
        this.container = container;
        this.predictions = [];
        this.onSelectCallback = null;
        this.enabled = true; // Track toggle state
        this.createUI();
    }

    createUI() {
        this.container.innerHTML = `
            <div class="autodraw-header">
                <h3>🎯 AutoDraw</h3>
                <label class="toggle-switch">
                    <input type="checkbox" id="autodraw-toggle" ${this.enabled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            <div id="predictions-list">
                <div class="hint-text">
                    ✏️ Mulai menggambar untuk melihat saran
                </div>
            </div>
        `;

        // Add toggle event listener
        const toggle = this.container.querySelector('#autodraw-toggle');
        toggle.addEventListener('change', (e) => {
            this.enabled = e.target.checked;
            if (this.onToggleCallback) {
                this.onToggleCallback(this.enabled);
            }
        });
    }

    setOnSelectCallback(callback) {
        this.onSelectCallback = callback;
    }

    setOnToggleCallback(callback) {
        this.onToggleCallback = callback;
    }

    updatePredictions(predictions) {
        // Only update if we have valid predictions and AutoDraw is enabled
        if (!this.enabled || !predictions || !Array.isArray(predictions) || predictions.length === 0) {
            // If predictions is empty or invalid, clear the display
            if (predictions && Array.isArray(predictions) && predictions.length === 0) {
                this.clearPredictions();
            }
            return;
        }
        
        this.predictions = predictions;
        this.renderPredictions();
    }

    renderPredictions() {
        const listContainer = this.container.querySelector('#predictions-list');
        
        if (this.predictions.length === 0) {
            listContainer.innerHTML = `
                <div class="hint-text">
                    ✏️ Mulai menggambar untuk melihat saran
                </div>
            `;
            return;
        }

        let predictionsHTML = '';
        
        this.predictions.forEach((predictionObj, index) => {
            // Handle both old format (string) and new format (object with confidence)
            const prediction = typeof predictionObj === 'string' ? predictionObj : predictionObj.name;
            const confidence = typeof predictionObj === 'object' && predictionObj.confidence ? predictionObj.confidence : (95 - index * 10);
            
            // Check if stencils exist for this prediction
            if (window.stencils && window.stencils[prediction] && window.stencils[prediction].length > 0) {
                // Add section header for this prediction with confidence
                predictionsHTML += `<div class="prediction-section">
                    <div class="prediction-title">
                        ${prediction} <span class="confidence-score">${confidence}%</span>
                    </div>
                    <div class="stencil-grid">`;
                
                // Add all stencils for this prediction
                window.stencils[prediction].forEach((stencil, stencilIndex) => {
                    predictionsHTML += `
                        <div class="prediction-item" 
                             data-prediction="${prediction}" 
                             data-stencil-index="${stencilIndex}"
                             title="Klik untuk menggambar ${prediction} (${confidence}%) - ${stencil.collection}">
                            <img src="${stencil.src}" 
                                 alt="${prediction}" 
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="prediction-fallback" style="display: none;">${prediction.charAt(0).toUpperCase()}</div>
                            <div class="prediction-hint">Klik untuk gambar</div>
                        </div>
                    `;
                });
                
                predictionsHTML += `</div></div>`;
            } else {
                // Fallback for predictions without stencils
                predictionsHTML += `
                    <div class="prediction-section">
                        <div class="prediction-title">
                            ${prediction} <span class="confidence-score">${confidence}%</span>
                        </div>
                        <div class="stencil-grid">
                            <div class="prediction-item" 
                                 data-prediction="${prediction}" 
                                 data-stencil-index="-1"
                                 title="Klik untuk menggambar ${prediction} (${confidence}%)">
                                <div class="prediction-fallback">${prediction.charAt(0).toUpperCase()}</div>
                                <div class="prediction-hint">Klik untuk gambar</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        listContainer.innerHTML = predictionsHTML;

        // Add click listeners
        const predictionItems = listContainer.querySelectorAll('.prediction-item');
        predictionItems.forEach(item => {
            item.addEventListener('click', () => {
                const prediction = item.dataset.prediction;
                const stencilIndex = parseInt(item.dataset.stencilIndex);
                if (this.onSelectCallback) {
                    this.onSelectCallback(prediction, stencilIndex);
                }
            });
        });
    }

    isEnabled() {
        const toggle = this.container.querySelector('#autodraw-toggle');
        return toggle ? toggle.checked : true;
    }

    clearPredictions() {
        // Force reset predictions array
        this.predictions = [];
        
        // Force clear any pending updates
        const listContainer = this.container.querySelector('#predictions-list');
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="hint-text">
                    ✏️ Mulai menggambar untuk melihat saran
                </div>
            `;
        }
        
        // Force immediate DOM update
        setTimeout(() => {
            const listContainer = this.container.querySelector('#predictions-list');
            if (listContainer && this.predictions.length === 0) {
                listContainer.innerHTML = `
                    <div class="hint-text">
                        ✏️ Mulai menggambar untuk melihat saran
                    </div>
                `;
            }
        }, 0);
        
        console.log('AutoDraw UI predictions cleared');
    }
}

// Export for use in main script
window.AutoDrawUI = AutoDrawUI;
