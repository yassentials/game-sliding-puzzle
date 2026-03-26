<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { GameResultWinEvent } from "./events/game";
import { MouseLeftClickEvent } from "./events/input";
import Game from "./game";
import settings from "./settings";

const canvasElement = ref<HTMLCanvasElement | null>(null);
const imageElement = ref<HTMLImageElement | null>(null);
const win = ref<boolean>(false);
const isLoaded = ref<boolean>(false);
const showPreview = ref<boolean>(true);

// Responsive block size based on viewport
const blockSize = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 480) return 60;
    if (width < 768) return 80;
    if (width < 1024) return 90;
    return settings.blockSize;
  }
  return settings.blockSize;
});

const canvasSize = computed(() => settings.size * blockSize.value);

onMounted(async () => {
  const canvas = canvasElement.value;

  if (canvas === null) {
    throw new Error("failed to retrieve canvas");
  }

  const context = canvas.getContext("2d");

  if (context === null) {
    throw new Error("failed to retrieve rendering context");
  }

  const filenames = [
    "photo1.jpeg",
    "photo2.jpeg",
    "photo3.jpeg",
    "photo4.jpeg",
    "photo5.jpeg",
    "photo6.jpeg",
  ];

  const randomIndex = Math.floor(Math.random() * filenames.length);

  const imageURL = new URL(
    `./assets/images/${filenames[randomIndex]}?url`,
    import.meta.url,
  );

  const image = imageElement.value;

  if (image) {
    image.src = imageURL.href;
    image.onload = () => {
      isLoaded.value = true;
    };
  }

  // Create responsive settings
  const responsiveSettings = {
    ...settings,
    blockSize: blockSize.value,
  };

  const game = new Game(canvas, responsiveSettings, imageURL.href);

  canvas.addEventListener("click", (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    game.dispatchEvent(new MouseLeftClickEvent(x, y));
  });

  // Touch support for mobile
  canvas.addEventListener("touchstart", (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    game.dispatchEvent(new MouseLeftClickEvent(x, y));
  }, { passive: false });

  game.addEventListener(GameResultWinEvent.EVENT_NAME, () => {
    win.value = true;
    showPreview.value = false;
  });

  game.start();

  Object.defineProperty(window, "solve", {
    value: game.solve.bind(game),
  });
});

function togglePreview() {
  showPreview.value = !showPreview.value;
}

function newGame() {
  window.location.reload();
}
</script>

<template>
  <div class="app-container">
    <!-- Header -->
    <header class="header glass animate-fade-in">
      <h1 class="title gradient-text">Sliding Puzzle</h1>
      <p class="subtitle">Rearrange the tiles to complete the image</p>
    </header>

    <!-- Main Game Area -->
    <main class="main-content">
      <!-- Game Board -->
      <div class="game-section">
        <div 
          class="canvas-wrapper glass animate-pulse-glow"
          :style="{ '--canvas-size': canvasSize + 'px' }"
        >
          <canvas 
            ref="canvasElement" 
            :width="canvasSize"
            :height="canvasSize"
          ></canvas>
          
          <!-- Win Overlay -->
          <div 
            v-if="win"
            class="win-overlay animate-slide-up"
          >
            <div class="win-content">
              <span class="win-icon">🎉</span>
              <h2 class="win-title gradient-text">You Win!</h2>
              <p class="win-message">Congratulations! You solved the puzzle!</p>
              <button @click="newGame" class="btn btn-primary">
                Play Again
              </button>
            </div>
          </div>

          <!-- Loading Overlay -->
          <div v-if="!isLoaded" class="loading-overlay">
            <div class="loading-spinner"></div>
            <p>Loading puzzle...</p>
          </div>
        </div>
      </div>

      <!-- Preview Panel -->
      <div class="preview-section">
        <div class="preview-card glass">
          <div class="preview-header">
            <h3 class="preview-title">Preview</h3>
            <button 
              @click="togglePreview" 
              class="btn btn-icon"
              :title="showPreview ? 'Hide Preview' : 'Show Preview'"
            >
              {{ showPreview ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          
          <div class="preview-image-container" :class="{ hidden: !showPreview }">
            <img 
              ref="imageElement" 
              :width="canvasSize" 
              :height="canvasSize"
              alt="Preview"
              class="preview-image"
            />
          </div>
          
          <div v-if="!showPreview" class="preview-placeholder">
            <span class="placeholder-icon">🔒</span>
            <p>Preview hidden</p>
            <button @click="togglePreview" class="btn btn-secondary btn-sm">
              Show Preview
            </button>
          </div>
        </div>

        <!-- Controls -->
        <div class="controls glass">
          <h3 class="controls-title">Controls</h3>
          <div class="controls-list">
            <div class="control-item">
              <span class="control-key">Click/Tap</span>
              <span class="control-desc">Move tile</span>
            </div>
            <div class="control-item">
              <span class="control-key">Solve</span>
              <span class="control-desc">Auto-complete</span>
            </div>
          </div>
          <button @click="newGame" class="btn btn-secondary full-width">
            🔄 New Game
          </button>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer glass">
      <p>Tap a tile adjacent to the empty space to move it</p>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  gap: var(--spacing-lg);
}

/* Header */
.header {
  text-align: center;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-radius: var(--radius-lg);
}

.title {
  font-size: clamp(1.75rem, 5vw, 2.5rem);
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: clamp(0.875rem, 2vw, 1rem);
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xl);
}

@media (min-width: 1024px) {
  .main-content {
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
  }
}

/* Game Section */
.game-section {
  display: flex;
  justify-content: center;
}

.canvas-wrapper {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform var(--transition-normal);
}

.canvas-wrapper:hover {
  transform: scale(1.01);
}

.canvas-wrapper canvas {
  display: block;
  max-width: 100%;
  height: auto;
  touch-action: manipulation;
}

/* Win Overlay */
.win-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 15, 26, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
}

.win-content {
  text-align: center;
  padding: var(--spacing-xl);
}

.win-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: var(--spacing-md);
  animation: bounce 0.6s ease infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.win-title {
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.win-message {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

/* Loading */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: var(--color-bg-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Preview Section */
.preview-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  width: 100%;
  max-width: 400px;
}

@media (min-width: 1024px) {
  .preview-section {
    width: auto;
  }
}

.preview-card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.preview-title {
  font-size: 1.125rem;
  font-weight: 600;
}

.preview-image-container {
  transition: opacity var(--transition-normal);
}

.preview-image-container.hidden {
  display: none;
}

.preview-image {
  width: 100%;
  max-width: 300px;
  height: auto;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.preview-placeholder {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-md);
  color: var(--color-text-secondary);
}

.placeholder-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: var(--spacing-sm);
}

/* Controls */
.controls {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
}

.controls-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.controls-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.control-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.control-item:last-child {
  border-bottom: none;
}

.control-key {
  font-family: monospace;
  background: var(--color-bg-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.control-desc {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-accent-primary), #ff6b6b);
  color: white;
}

.btn-primary:hover {
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-bg-card);
  border-color: var(--color-accent-primary);
}

.btn-icon {
  background: transparent;
  padding: var(--spacing-sm);
  font-size: 1.25rem;
}

.btn-icon:hover {
  background: var(--color-bg-secondary);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: 0.875rem;
}

.full-width {
  width: 100%;
}

/* Footer */
.footer {
  text-align: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .app-container {
    padding: var(--spacing-sm);
    gap: var(--spacing-md);
  }
  
  .header {
    padding: var(--spacing-md);
  }
  
  .preview-card,
  .controls {
    padding: var(--spacing-md);
  }
}
</style>
