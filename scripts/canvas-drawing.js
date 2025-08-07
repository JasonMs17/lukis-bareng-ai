class CanvasDrawing {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.drawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.currentTool = "brush";
        this.brushSize = 8;
        this.currentStroke = [];
        this.isShowingResult = false;
        
        // Initialize white canvas
        this.clearCanvas();
        
        // Bind methods
        this.initializeEventListeners();
        this.initializeToolButtons();
    }

    clearCanvas() {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalCompositeOperation = "source-over";
    }

    initializeToolButtons() {
        const toolButtons = document.querySelectorAll(".tool-btn");
        
        toolButtons.forEach((button) => {
            button.addEventListener("click", () => {
                toolButtons.forEach((btn) => btn.classList.remove("active"));
                button.classList.add("active");
                const newTool = button.dataset.tool;

                this.currentTool = newTool;

                if (this.currentTool === "eraser") {
                    this.brushSize = 30;
                } else {
                    this.brushSize = 12;
                }
            });
        });
    }

    initializeEventListeners() {
        // Mouse events
        this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
        this.canvas.addEventListener("mouseup", () => this.handleMouseUp());
        this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
        this.canvas.addEventListener("mouseleave", () => this.handleMouseLeave());
        this.canvas.addEventListener("mouseenter", () => this.handleMouseEnter());

        // Touch events
        this.canvas.addEventListener("touchstart", (e) => this.handleTouchStart(e));
        this.canvas.addEventListener("touchend", (e) => this.handleTouchEnd(e));
        this.canvas.addEventListener("touchmove", (e) => this.handleTouchMove(e));
    }

    getCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    startDrawing(x, y) {
        if (this.isShowingResult) return;
        
        this.drawing = true;
        this.lastX = x;
        this.lastY = y;

        // Start new stroke for brush only
        if (this.currentTool === "brush") {
            this.currentStroke = [{x: x, y: y}];
        }
    }

    draw(currentX, currentY) {
        if (!this.drawing || this.isShowingResult) return;

        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";

        if (this.currentTool === "brush") {
            this.ctx.strokeStyle = "black";
            this.ctx.globalCompositeOperation = "source-over";
            // Add point to current stroke
            this.currentStroke.push({x: currentX, y: currentY});
        } 
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();

        this.lastX = currentX;
        this.lastY = currentY;
    }

    stopDrawing() {
        if (this.drawing) {
            this.drawing = false;
            // Reset composite operation to normal
            this.ctx.globalCompositeOperation = "source-over";
            
            // Add completed brush stroke to AutoDraw
            if (this.currentTool === "brush" && this.currentStroke.length > 2) {
                window.autoDraw.addStroke(this.currentStroke);
            }
            
            this.currentStroke = [];
        }
    }

    // Mouse event handlers
    handleMouseDown(e) {
        const coords = this.getCanvasCoordinates(e.clientX, e.clientY);
        this.startDrawing(coords.x, coords.y);
    }

    handleMouseUp() {
        this.stopDrawing();
    }

    handleMouseMove(e) {
        const coords = this.getCanvasCoordinates(e.clientX, e.clientY);
        this.draw(coords.x, coords.y);
    }

    handleMouseLeave() {
        this.stopDrawing();
    }

    handleMouseEnter() {
        this.drawing = false;
    }

    // Touch event handlers
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const coords = this.getCanvasCoordinates(touch.clientX, touch.clientY);
        this.startDrawing(coords.x, coords.y);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.stopDrawing();
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.drawing) return;
        
        const touch = e.touches[0];
        const coords = this.getCanvasCoordinates(touch.clientX, touch.clientY);
        this.draw(coords.x, coords.y);
    }

    // Public methods
    setShowingResult(showing) {
        this.isShowingResult = showing;
    }

    getCurrentTool() {
        return this.currentTool;
    }

    getCanvas() {
        return this.canvas;
    }

    getContext() {
        return this.ctx;
    }

    // Undo last stroke and redraw canvas
    undoLastStroke() {
        const hasStroke = window.autoDraw.undoLastStroke();
        if (hasStroke) {
            this.redrawCanvas();
        }
        return hasStroke;
    }

    // Redraw canvas from stroke data
    redrawCanvas() {
        this.clearCanvas();
        
        const strokes = window.autoDraw.strokeData;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = this.brushSize;

        strokes.forEach(stroke => {
            if (stroke.length > 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(stroke[0].x, stroke[0].y);
                stroke.forEach(point => {
                    this.ctx.lineTo(point.x, point.y);
                });
                this.ctx.stroke();
            }
        });
    }
}

window.CanvasDrawing = CanvasDrawing;
