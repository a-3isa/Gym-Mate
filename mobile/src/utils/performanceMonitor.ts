/**
 * Performance monitoring utility for 3D rendering.
 * Tracks FPS and can trigger auto-downgrade to 2D when performance drops.
 */
class PerformanceMonitor {
  private frameCount: number = 0;
  private lastTime: number = 0;
  private fps: number = 0;
  private fpsHistory: number[] = [];
  private memoryWarningCount: number = 0;
  private animationFrameId: number | null = null;
  private handleLowPerformanceCallback?: () => void;

  /**
   * Starts monitoring performance using requestAnimationFrame.
   * Measures FPS every second and stores in history.
   */
  startMonitoring(): void {
    if (this.animationFrameId !== null) {
      // Already monitoring
      return;
    }

    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];

    const measureFPS = (currentTime: number) => {
      this.frameCount++;

      // Calculate FPS every second
      if (currentTime - this.lastTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        
        // Add to history, keep last 10 readings
        this.fpsHistory.push(this.fps);
        if (this.fpsHistory.length > 10) {
          this.fpsHistory.shift();
        }

        // Check if performance is consistently low
        if (this.isPerformanceAcceptable() === false && this.handleLowPerformanceCallback) {
          this.handleLowPerformanceCallback();
        }

        // Reset for next measurement
        this.frameCount = 0;
        this.lastTime = currentTime;
      }

      // Continue monitoring
      this.animationFrameId = requestAnimationFrame(measureFPS);
    };

    this.animationFrameId = requestAnimationFrame(measureFPS);
  }

  /**
   * Returns the current FPS reading.
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Calculates and returns the average FPS from history.
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) {
      return 0;
    }
    const sum = this.fpsHistory.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / this.fpsHistory.length);
  }

  /**
   * Checks if performance is acceptable for 3D rendering.
   * Returns true if average FPS >= 25.
   */
  isPerformanceAcceptable(): boolean {
    const avgFPS = this.getAverageFPS();
    // Need at least 5 readings for a valid assessment
    if (this.fpsHistory.length < 5) {
      return true; // Assume acceptable until we have enough data
    }
    return avgFPS >= 25;
  }

  /**
   * Sets a callback to be called when low performance is detected.
   * This can be used to switch from 3D to 2D mode.
   * 
   * @param callback - Function to call when performance is low
   */
  handleLowPerformance(callback: () => void): void {
    this.handleLowPerformanceCallback = callback;
  }

  /**
   * Stops performance monitoring and cleans up resources.
   */
  stopMonitoring(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.frameCount = 0;
    this.fps = 0;
    this.fpsHistory = [];
    this.memoryWarningCount = 0;
  }

  /**
   * Increments memory warning counter.
   * Can be called from external memory pressure events.
   */
  reportMemoryWarning(): void {
    this.memoryWarningCount++;
  }

  /**
   * Gets the current memory warning count.
   */
  getMemoryWarningCount(): number {
    return this.memoryWarningCount;
  }
}

/**
 * Singleton instance for global performance monitoring.
 * Usage:
 * - performanceMonitor.startMonitoring() to begin
 * - performanceMonitor.getFPS() to get current FPS
 * - performanceMonitor.handleLowPerformance(callback) to set auto-downgrade
 * - performanceMonitor.stopMonitoring() to clean up
 */
export const performanceMonitor = new PerformanceMonitor();
