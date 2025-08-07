class StencilConverter {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.originalImageData = null;
    this.isShowingResult = false;
  }

  // Convert drawing to stencil based on top prediction
  async convertToStencil() {
    // Reset showing result state
    this.isShowingResult = false;
    
    // Check if canvas is visually empty
    if (window.canvasUtils.isCanvasEmpty()) {
      alert("Silakan gambar sesuatu terlebih dahulu! ✏️");
      // Reset converting state
      if (window.drawingApp) {
        window.drawingApp.setConvertingState(false);
      }
      return;
    }

    // Also check stroke data as backup
    if (window.autoDraw.strokeData.length === 0) {
      alert("Silakan gambar sesuatu terlebih dahulu! ✏️");
      // Reset converting state
      if (window.drawingApp) {
        window.drawingApp.setConvertingState(false);
      }
      return;
    }

    const buttons = document.querySelectorAll(".convert-btn");
    const originalText = buttons[0] ? buttons[0].textContent : "Konversi";

    // Immediately update UI to show loading state for all convert buttons
    buttons.forEach(btn => {
      btn.textContent = "Loading ...";
      btn.disabled = true;
    });
    
    // Immediately disable other buttons when conversion starts
    const undoBtns = document.querySelectorAll(".undo-btn");
    const clearBtns = document.querySelectorAll(".clear-btn");
    undoBtns.forEach(btn => btn.disabled = true);
    clearBtns.forEach(btn => btn.disabled = true);

    try {
      // Get predictions from AutoDraw
      await window.autoDraw.getPredictions();

      const predictions = window.autoDraw.predictions;

      if (predictions.length === 0) {
        alert("Tidak dapat mengenali gambar. Coba gambar yang lebih jelas! 🎨");
        return;
      }

      // Get the top prediction
      const topPrediction =
        typeof predictions[0] === "string"
          ? predictions[0]
          : predictions[0].name;

      console.log("Top prediction:", topPrediction);

      // Check if stencil exists for this prediction
      if (
        window.stencils &&
        window.stencils[topPrediction] &&
        window.stencils[topPrediction].length > 0
      ) {
        // Randomly select one stencil
        const stencils = window.stencils[topPrediction];
        const randomIndex = Math.floor(Math.random() * stencils.length);
        const stencil = stencils[randomIndex];

        console.log(
          `Converting to stencil for "${topPrediction}" from collection: ${stencil.collection}`
        );
        
        // Wait for the drawing to complete before showing result
        await this.drawSvgToCanvas(stencil.src, topPrediction);
      } else {
        // Fallback if no stencil found
        console.log("No stencil found for:", topPrediction);
        alert(
          `Prediksi "${topPrediction}" tidak memiliki stencil yang tersedia.`
        );
      }
    } catch (error) {
      console.error("Error converting to stencil:", error);
      alert("Terjadi kesalahan saat mengkonversi. Coba lagi! 😊");
    } finally {
      // Only reset button state if we're not showing a result
      if (!this.isShowingResult) {
        buttons.forEach(btn => {
          btn.textContent = originalText;
          btn.disabled = false;
        });
        
        // Re-enable other buttons if not showing result
        undoBtns.forEach(btn => btn.disabled = false);
        clearBtns.forEach(btn => btn.disabled = false);
      }
      
      // Reset converting state when done
      if (window.drawingApp) {
        window.drawingApp.setConvertingState(false);
      }
    }
  }

  // Draw SVG to canvas
  async drawSvgToCanvas(svgUrl, prediction) {
    return new Promise((resolve, reject) => {
      try {
        // Store original before conversion
        this.originalImageData = window.canvasUtils.getImageData();

        // Clear canvas first
        window.canvasUtils.clearCanvas();

        // Create image directly from SVG URL
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          try {
            // Calculate scaling to fit canvas while maintaining aspect ratio
            const scale =
              Math.min(
                this.canvas.width / img.width,
                this.canvas.height / img.height
              ) * 0.7; // 0.7 for padding

            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const x = (this.canvas.width - scaledWidth) / 2;
            const y = (this.canvas.height - scaledHeight) / 2;

            this.ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

            // Clear AutoDraw strokes
            window.autoDraw.clearStrokes();

            // Show prediction name and update state immediately
            this.showResult(prediction);

            console.log(`Stencil "${prediction}" berhasil digambar di canvas`);
            resolve();
          } catch (drawError) {
            console.error("Error drawing image:", drawError);
            this.drawTextFallback(prediction);
            resolve();
          }
        };

        img.onerror = (error) => {
          console.error("Error loading SVG:", svgUrl, error);
          // Fallback: draw text
          this.drawTextFallback(prediction);
          resolve();
        };

        img.src = svgUrl;
      } catch (error) {
        console.error("Error in drawSvgToCanvas:", error);
        // Fallback: draw text
        this.drawTextFallback(prediction);
        resolve();
      }
    });
  }

  // Fallback text drawing
  drawTextFallback(prediction) {
    this.ctx.fillStyle = "black";
    this.ctx.font = "48px Comic Sans MS";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      prediction,
      this.canvas.width / 2,
      this.canvas.height / 2
    );
    window.autoDraw.clearStrokes();
    
    // Show result state immediately
    this.showResult(prediction);
  }

  // Show result state
  showResult(prediction) {
    // Set state immediately
    this.isShowingResult = true;
    window.canvasDrawing.setShowingResult(true);
    
    // Update button text immediately for all convert buttons
    const convertBtns = document.querySelectorAll(".convert-btn");
    convertBtns.forEach(btn => {
      btn.textContent = "🔄 Reset";
      btn.disabled = false;
    });
    
    // Hide reset button if exists
    const resetBtn = document.querySelector(".reset-btn");
    if (resetBtn) resetBtn.style.display = "none";
    
    // Show prediction result in the floating box
    const predDiv = document.getElementById("prediction-result");
    if (predDiv) {
      predDiv.textContent = prediction;
      predDiv.style.display = "block";
    }
    
    // Update button states immediately after showing result
    if (window.drawingApp) {
      window.drawingApp.showResultState();
    }
    
    console.log(`Result shown for: ${prediction}`);
  }

  // Reset to original drawing
  resetCanvas() {
    if (this.originalImageData) {
      window.canvasUtils.putImageData(this.originalImageData);
      this.originalImageData = null;
    } else {
      window.canvasUtils.clearCanvas();
    }
    this.isShowingResult = false;
    window.canvasDrawing.setShowingResult(false);
    
    // Hide prediction result
    const predDiv = document.getElementById("prediction-result");
    if (predDiv) {
      predDiv.textContent = "";
      predDiv.style.display = "none";
    }
    
    // Hide reset button if exists
    const resetBtn = document.querySelector(".reset-btn");
    if (resetBtn) resetBtn.style.display = "none";
    
    // Reset drawing app state
    if (window.drawingApp) {
      window.drawingApp.resetResultState();
    }
  }

  // Clear everything
  clearAll() {
    window.canvasUtils.clearCanvas();
    window.autoDraw.clearStrokes();

    // Reset state
    this.isShowingResult = false;
    window.canvasDrawing.setShowingResult(false);
    this.originalImageData = null;

    // Hide reset button if exists
    const resetBtn = document.querySelector(".reset-btn");
    if (resetBtn) {
      resetBtn.style.display = "none";
      resetBtn.textContent = "🔄 Gambar Lagi";
    }

    // Hide prediction result
    const predDiv = document.getElementById("prediction-result");
    if (predDiv) {
      predDiv.textContent = "";
      predDiv.style.display = "none";
    }
    
    // Reset drawing app state
    if (window.drawingApp) {
      window.drawingApp.resetResultState();
    }
    
    console.log("Canvas cleared completely");
  }
}

window.StencilConverter = StencilConverter;
