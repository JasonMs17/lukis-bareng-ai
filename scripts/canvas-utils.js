class CanvasUtils {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    // Check if canvas is empty (only white pixels)
    isCanvasEmpty() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3]; // alpha

            // pixel dianggap kosong kalau putih ATAU transparan
            if (!((r === 255 && g === 255 && b === 255) || a === 0)) {
                return false;
            }
        }
        return true;
    }


    // Rebuild stroke data from canvas after eraser use
    rebuildStrokeDataFromCanvas() {
        if (this.isCanvasEmpty()) {
            window.autoDraw.clearStrokes();
            return;
        }

        // Get canvas image data
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        // Find non-white pixels and create simplified stroke data
        const pixels = [];
        for (let y = 0; y < this.canvas.height; y += 3) { // Sample every 3rd row for performance
            for (let x = 0; x < this.canvas.width; x += 3) { // Sample every 3rd column
                const index = (y * this.canvas.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                // If pixel is not white, it's part of the drawing
                if (r !== 255 || g !== 255 || b !== 255) {
                    pixels.push({x: x, y: y});
                }
            }
        }
        
        // Create stroke data from found pixels
        if (pixels.length > 0) {
            // Group nearby pixels into strokes
            const strokes = [];
            let currentStroke = [pixels[0]];
            
            for (let i = 1; i < pixels.length; i++) {
                const prevPixel = pixels[i - 1];
                const currentPixel = pixels[i];
                const distance = Math.sqrt(
                    Math.pow(currentPixel.x - prevPixel.x, 2) + 
                    Math.pow(currentPixel.y - prevPixel.y, 2)
                );
                
                if (distance < 20) { // Close enough to be same stroke
                    currentStroke.push(currentPixel);
                } else {
                    // Start new stroke
                    if (currentStroke.length > 2) {
                        strokes.push(currentStroke);
                    }
                    currentStroke = [currentPixel];
                }
            }
            
            // Add final stroke
            if (currentStroke.length > 2) {
                strokes.push(currentStroke);
            }
            
            // Set stroke data in AutoDraw
            window.autoDraw.setStrokeData(strokes);
            console.log('Rebuilt', strokes.length, 'strokes from canvas');
        }
    }

    // Clear canvas completely
    clearCanvas() {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalCompositeOperation = "source-over";
    }

    // Get image data for backup/restore
    getImageData() {
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    // Restore image data from backup
    putImageData(imageData) {
        this.ctx.putImageData(imageData, 0, 0);
    }
}

window.CanvasUtils = CanvasUtils;
