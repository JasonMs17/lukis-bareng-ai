// AutoDraw API Integration
class AutoDraw {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.predictions = [];
        this.strokeData = [];
    }

    // Add stroke data (only for brush strokes)
    addStroke(strokePoints) {
        if (strokePoints && strokePoints.length > 0) {
            this.strokeData.push(strokePoints);
        }
    }

    // Clear all stroke data
    clearStrokes() {
        this.strokeData = [];
        this.predictions = [];
        console.log('AutoDraw strokes cleared');
    }

    // Undo last stroke
    undoLastStroke() {
        if (this.strokeData.length > 0) {
            const removedStroke = this.strokeData.pop();
            console.log('Undo: Removed last stroke, remaining:', this.strokeData.length);
            return true;
        }
        console.log('Undo: No strokes to remove');
        return false;
    }

    // Set stroke data from external source (like rebuild function)
    setStrokeData(strokes) {
        this.strokeData = strokes || [];
        console.log('AutoDraw stroke data set:', this.strokeData.length, 'strokes');
    }

    // Get predictions from AutoDraw API (called manually on convert)
    async getPredictions() {
        if (this.strokeData.length === 0) {
            this.predictions = [];
            return;
        }

        try {
            // Format strokes for AutoDraw API
            const postArray = this.strokeData.map(stroke => {
                const xCoords = [];
                const yCoords = [];
                const times = [];
                
                stroke.forEach((point, index) => {
                    xCoords.push(point[0] || point.x);
                    yCoords.push(point[1] || point.y);
                    times.push(index * 10); // Simple timing
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

            console.log('Getting predictions for', this.strokeData.length, 'strokes');

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
            console.log('AutoDraw API response received');
            
            // Parse predictions
            if (jsonResponse && jsonResponse[1] && jsonResponse[1][0] && jsonResponse[1][0][1]) {
                const rawPredictions = jsonResponse[1][0][1].slice(0, 8);
                
                // Add confidence scores
                this.predictions = rawPredictions.map((prediction, index) => {
                    const confidence = Math.max(95 - (index * 10), 25);
                    return {
                        name: prediction,
                        confidence: confidence
                    };
                });
                
                console.log('Predictions:', this.predictions.map(p => p.name));
            } else {
                console.log('No predictions found');
                this.predictions = [];
            }
        } catch (error) {
            console.error('Error getting predictions:', error);
            this.predictions = [];
        }
    }
}

window.AutoDraw = AutoDraw;
