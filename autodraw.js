// AutoDraw API Integration
class AutoDraw {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.predictions = [];
        this.isEnabled = true;
        this.strokeData = [];
        this.currentStroke = [];
        this.predictionCallback = null;
        this.predictionTimeout = null; // For debouncing
        this.lastPredictionTime = 0;
        this.minPredictionInterval = 500; // Minimum 500ms between predictions
        this.strokeStartTime = 0; // For accurate timing
        this.requestId = 0; // Add request ID to track valid requests
        this.currentRequestId = 0; // Track current valid request ID
    }

    // Set callback for when predictions are received
    setPredictionCallback(callback) {
        this.predictionCallback = callback;
    }

    // Start recording a new stroke
    startStroke(x, y) {
        if (!this.isEnabled) return;
        this.currentStroke = [];
        this.strokeStartTime = Date.now();
        this.currentStroke.push([Math.round(x), Math.round(y), 0]); // Include timestamp
        console.log('Started stroke at:', x, y);
    }

    // Add point to current stroke
    addToStroke(x, y) {
        if (!this.isEnabled || this.currentStroke.length === 0) return;
        
        // Only add point if it's different enough from the last point (reduce noise)
        const lastPoint = this.currentStroke[this.currentStroke.length - 1];
        const distance = Math.sqrt(Math.pow(x - lastPoint[0], 2) + Math.pow(y - lastPoint[1], 2));
        
        if (distance > 2) { // Minimum distance threshold
            const time = Date.now() - this.strokeStartTime;
            this.currentStroke.push([Math.round(x), Math.round(y), time]);
        }
    }

    // Finish current stroke and get predictions
    async endStroke() {
        if (!this.isEnabled || this.currentStroke.length < 3) return; // Need at least 3 points
        
        console.log('Ending stroke with', this.currentStroke.length, 'points');
        this.strokeData.push([...this.currentStroke]); // Copy the stroke
        this.currentStroke = [];
        
        // Debounce predictions to avoid too many API calls
        if (this.predictionTimeout) {
            clearTimeout(this.predictionTimeout);
        }
        
        const now = Date.now();
        const timeSinceLastPrediction = now - this.lastPredictionTime;
        
        if (timeSinceLastPrediction >= this.minPredictionInterval) {
            // Get predictions immediately
            await this.getPredictions();
        } else {
            // Wait for the remaining time
            const remainingTime = this.minPredictionInterval - timeSinceLastPrediction;
            this.predictionTimeout = setTimeout(() => {
                this.getPredictions();
            }, remainingTime);
        }
    }

    // Clear all stroke data
    clearStrokes() {
        this.strokeData = [];
        this.currentStroke = [];
        this.predictions = [];
        this.lastPredictionTime = 0; // Reset prediction timing
        this.strokeStartTime = 0; // Reset stroke timing
        
        // Invalidate any pending requests by incrementing request ID
        this.requestId++;
        this.currentRequestId = this.requestId;
        
        // Clear any pending prediction timeout
        if (this.predictionTimeout) {
            clearTimeout(this.predictionTimeout);
            this.predictionTimeout = null;
        }
        
        // Immediately clear predictions from UI
        if (this.predictionCallback) {
            this.predictionCallback([]);
        }
        
        console.log('All AutoDraw strokes and predictions cleared, requestId:', this.requestId);
    }

    // Get predictions from AutoDraw API
    async getPredictions() {
        if (this.strokeData.length === 0) return;

        this.lastPredictionTime = Date.now();
        
        // Create a request ID for this specific request
        const thisRequestId = ++this.requestId;
        this.currentRequestId = thisRequestId;

        try {
            // Format strokes exactly like the original autodraw-app
            const postArray = this.strokeData.map(stroke => {
                const xCoords = [];
                const yCoords = [];
                const times = [];
                
                stroke.forEach(point => {
                    xCoords.push(point[0]);
                    yCoords.push(point[1]);
                    times.push(point[2] || 0); // Use actual timing if available
                });
                
                return [xCoords, yCoords, times];
            });

            const requestBody = {
                input_type: 0,
                requests: [{
                    ink: postArray,
                    language: "autodraw",
                    writing_guide: {
                        height: this.canvas.height,
                        width: this.canvas.width
                    }
                }]
            };

            console.log('Sending AutoDraw request:', requestBody, 'requestId:', thisRequestId);

            // Use exact URL and headers from original autodraw-app
            const url = "https://inputtools.google.com/request?ime=handwriting&app=autodraw&dbg=1&cs=1&oe=UTF-8";
            
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const jsonResponse = await response.json();
            console.log('AutoDraw response:', jsonResponse, 'requestId:', thisRequestId, 'currentRequestId:', this.currentRequestId);
            
            // Check if this response is still valid (not cleared)
            if (thisRequestId !== this.currentRequestId) {
                console.log('Ignoring outdated response, requestId:', thisRequestId, 'vs current:', this.currentRequestId);
                return;
            }
            
            // Parse response exactly like original
            if (jsonResponse && jsonResponse[1] && jsonResponse[1][0] && jsonResponse[1][0][1]) {
                const rawPredictions = jsonResponse[1][0][1].slice(0, 8); // Get top 8 predictions
                
                // Add simulated confidence scores based on order
                // First prediction gets highest score, decreasing for subsequent ones
                this.predictions = rawPredictions.map((prediction, index) => {
                    const confidence = Math.max(95 - (index * 10), 25); // 95%, 85%, 75%, etc., minimum 25%
                    return {
                        name: prediction,
                        confidence: confidence
                    };
                });
                
                console.log('Extracted predictions with confidence:', this.predictions);
                if (this.predictionCallback) {
                    this.predictionCallback(this.predictions);
                }
            } else {
                console.log('No predictions found in response');
                this.predictions = [];
                if (this.predictionCallback) {
                    this.predictionCallback([]);
                }
            }
        } catch (error) {
            console.error('Error getting AutoDraw predictions:', error);
            // Only clear predictions if this is still the current request
            if (thisRequestId === this.currentRequestId) {
                this.predictions = [];
                if (this.predictionCallback) {
                    this.predictionCallback([]);
                }
            }
        }
    }

    // Enable/disable autodraw
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            this.clearStrokes();
        }
        console.log('AutoDraw enabled:', enabled);
    }

    // Check if autodraw is enabled
    isAutoDrawEnabled() {
        return this.isEnabled;
    }
}

// Export for use in main script
window.AutoDraw = AutoDraw;
