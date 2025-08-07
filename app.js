// Initialize all components
class DrawingApp {
  constructor() {
    this.canvas = document.getElementById("draw");
    if (!this.canvas) {
      console.error('Canvas element with id "draw" not found');
      return;
    }
    
    this.undoBtns = document.querySelectorAll(".undo-btn"); // Get all undo buttons
    this.clearBtns = document.querySelectorAll(".clear-btn"); // Get all clear buttons
    this.convertBtns = document.querySelectorAll(".convert-btn"); // Get all convert buttons
    
    if (this.undoBtns.length === 0 || this.clearBtns.length === 0 || this.convertBtns.length === 0) {
      console.error('Required button elements not found');
      return;
    }
    
    this.isResultShown = false;
    this.isConverting = false;  // Add flag to track conversion state
    this.initializeComponents();
    this.setupButtonState();
  }

  initializeComponents() {
    try {
      window.autoDraw = new AutoDraw(this.canvas);
      window.canvasUtils = new CanvasUtils(this.canvas);
      window.canvasDrawing = new CanvasDrawing("draw");
      window.stencilConverter = new StencilConverter(this.canvas);
      console.log('All components initialized successfully');
    } catch (error) {
      console.error('Error initializing components:', error);
    }
  }

  setupButtonState() {
    // Initial state
    this.updateButtons();
    // Listen to drawing events on canvas
    this.canvas.addEventListener("mouseup", () =>
      setTimeout(() => this.updateButtons(), 10)
    );
    this.canvas.addEventListener("touchend", () =>
      setTimeout(() => this.updateButtons(), 10)
    );
    // Listen to mouseup on document to catch mouse release outside canvas
    document.addEventListener("mouseup", () =>
      setTimeout(() => this.updateButtons(), 10)
    );
    // Listen to clear/undo for all buttons
    this.undoBtns.forEach(btn => {
      btn.addEventListener("click", () =>
        setTimeout(() => this.updateButtons(), 10)
      );
    });
    this.clearBtns.forEach(btn => {
      btn.addEventListener("click", () =>
        setTimeout(() => this.updateButtons(), 10)
      );
    });
  }

  updateButtons() {
    if (!window.autoDraw || !window.autoDraw.strokeData) {
      console.warn('AutoDraw not properly initialized');
      return;
    }
    
    // Don't update buttons if currently converting
    if (this.isConverting) {
      return;
    }
    
    const hasStroke =
      window.autoDraw.strokeData && window.autoDraw.strokeData.length > 0;
    
    if (this.isResultShown) {
      // When result is shown, disable undo and clear buttons, enable convert as reset
      this.undoBtns.forEach(btn => btn.disabled = true);
      this.clearBtns.forEach(btn => btn.disabled = true);
      this.convertBtns.forEach(btn => {
        btn.disabled = false;
        btn.textContent = "Reset";
      });
    } else {
      // Normal state - enable/disable based on stroke data
      this.undoBtns.forEach(btn => btn.disabled = !hasStroke);
      this.clearBtns.forEach(btn => btn.disabled = !hasStroke);
      this.convertBtns.forEach(btn => {
        btn.disabled = !hasStroke;
        btn.textContent = "Konversi";
      });
    }
  }

  showResultState() {
    this.isResultShown = true;
    this.updateButtons();
  }

  resetResultState() {
    this.isResultShown = false;
    this.updateButtons();
  }
  
  setConvertingState(isConverting) {
    this.isConverting = isConverting;
    if (!isConverting) {
      // Allow button update when conversion is done
      this.updateButtons();
    }
  }
}

// Global functions for HTML onclick handlers
function convertToStencil() {
  if (!window.drawingApp) {
    console.error('DrawingApp not initialized yet');
    return;
  }
  
  // Prevent double click during conversion
  if (window.drawingApp.isConverting) {
    console.log('Conversion already in progress');
    return;
  }
  
  if (window.drawingApp.isResultShown) {
    // Reset mode - clear everything and return to normal state
    window.stencilConverter.clearAll();
    window.autoDraw.strokeData = [];
    // Hide prediction result
    const predDiv = document.getElementById("prediction-result");
    if (predDiv) {
      predDiv.textContent = "";
      predDiv.style.display = "none";
    }
    // Reset state
    window.drawingApp.resetResultState();
  } else {
    // Convert mode - set converting state
    window.drawingApp.setConvertingState(true);
    window.stencilConverter.convertToStencil();
  }
}

function resetCanvas() {
  if (!window.drawingApp || !window.stencilConverter) {
    console.error('DrawingApp or StencilConverter not initialized yet');
    return;
  }
  window.stencilConverter.resetCanvas();
  window.drawingApp.resetResultState();
}

function clearCanvas() {
  if (!window.drawingApp || !window.stencilConverter || !window.autoDraw) {
    console.error('Required components not initialized yet');
    return;
  }
  
  // Only allow clear if not showing result (button should be disabled anyway)
  if (window.drawingApp.isResultShown) {
    console.log('Clear canvas blocked - result is being shown');
    return;
  }
  
  window.stencilConverter.clearAll();
  window.autoDraw.strokeData = [];
  
  // Update button states after clearing
  window.drawingApp.updateButtons();
}

function undoLastStroke() {
  if (!window.drawingApp || !window.canvasDrawing) {
    console.error('DrawingApp or CanvasDrawing not initialized yet');
    return;
  }
  
  // Only allow undo if not showing result (button should be disabled anyway)
  if (window.drawingApp.isResultShown) {
    console.log('Undo blocked - result is being shown');
    return;
  }
  
  // Perform the undo operation
  window.canvasDrawing.undoLastStroke();
  
  // Update button states
  window.drawingApp.updateButtons();
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  window.drawingApp = new DrawingApp();
});

window.DrawingApp = DrawingApp;
