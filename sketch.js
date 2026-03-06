// ═══════════════════════════════════════════════════════════════
// Fourier Artisan — Modernized Sketch
// ═══════════════════════════════════════════════════════════════

// --- State ---
let fourierX, fourierY;
let time = 0;
let path = [];
let fullPathPoints = [];
let isDrawing = false;
let drawingComplete = false;
let speedMultiplier = 1;

// --- UI Elements ---
let landingPage, appContainer, previewPanel, controlsPanel;
let precisionSlider, precisionValLabel, statusDisplay;
let speedSlider, speedValLabel;
let progressBar, pointCountLabel;
let loadingOverlay;

// --- Constants ---
const STATE_LANDING = 'LANDING';
const STATE_PREVIEW = 'PREVIEW';
const STATE_DRAWING = 'DRAWING';
let currentState = STATE_LANDING;

const INTERNAL_WIDTH = 1280;
const INTERNAL_HEIGHT = 720;

// ═══ Setup ═══
function setup() {
  const canvas = createCanvas(INTERNAL_WIDTH, INTERNAL_HEIGHT);
  canvas.parent('canvas-container');

  // Cache DOM
  landingPage = document.getElementById('landing-page');
  appContainer = document.getElementById('app-container');
  previewPanel = document.getElementById('preview-panel');
  controlsPanel = document.getElementById('controls-panel');
  precisionSlider = document.getElementById('precision-slider');
  precisionValLabel = document.getElementById('precision-val');
  statusDisplay = document.getElementById('status-display');
  speedSlider = document.getElementById('speed-slider');
  speedValLabel = document.getElementById('speed-val');
  progressBar = document.getElementById('progress-bar');
  pointCountLabel = document.getElementById('point-count');
  loadingOverlay = document.getElementById('loading-overlay');

  // Create landing particles
  createParticles();

  // --- Event Listeners ---
  document.getElementById('start-default').addEventListener('click', () => {
    if (typeof drawing !== 'undefined' && drawing.length > 0) {
      processPoints(drawing);
    }
  });

  document.getElementById('upload-trigger').addEventListener('click', () => {
    document.getElementById('image-input').click();
  });

  document.getElementById('image-input').addEventListener('change', handleFile);
  document.getElementById('export-svg-btn').addEventListener('click', exportToSVG);
  document.getElementById('export-json-btn').addEventListener('click', exportToJSON);
  document.getElementById('start-drawing-btn').addEventListener('click', startDrawing);

  precisionSlider.addEventListener('input', (e) => {
    precisionValLabel.textContent = e.target.value;
    if (fullPathPoints.length > 0 && currentState === STATE_DRAWING) {
      initFourier(fullPathPoints);
    }
  });

  speedSlider.addEventListener('input', (e) => {
    speedMultiplier = parseInt(e.target.value);
    speedValLabel.textContent = speedMultiplier + '×';
  });

  document.getElementById('back-to-landing-btn').addEventListener('click', showLanding);
}

// ═══ Particle Background ═══
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const count = 30;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 8 + 's';
    particle.style.animationDuration = (6 + Math.random() * 6) + 's';
    particle.style.width = particle.style.height = (1 + Math.random() * 2) + 'px';
    container.appendChild(particle);
  }
}

// ═══ File Upload ═══
function handleFile(e) {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;

  showLoading('Analyzing your image...');

  const reader = new FileReader();
  reader.onload = function (event) {
    loadImage(event.target.result, processUploadedImage, () => {
      hideLoading();
      alert('Failed to load image. Please try a different file.');
    });
  };
  reader.onerror = function () {
    hideLoading();
    alert('Failed to read file.');
  };
  reader.readAsDataURL(file);
}

// ═══ Image Processing ═══
function processUploadedImage(img) {
  showLoading('Extracting outline...');

  // Use setTimeout to allow the UI to update before heavy computation
  setTimeout(() => {
    img.resize(400, 0);
    if (img.height > 400) img.resize(0, 400);

    img.loadPixels();
    const rawPoints = [];

    for (let j = 1; j < img.height - 1; j++) {
      for (let i = 1; i < img.width - 1; i++) {
        const index = (i + j * img.width) * 4;
        const bright = (img.pixels[index] + img.pixels[index + 1] + img.pixels[index + 2]) / 3;
        if (bright < 128) {
          rawPoints.push({ x: i, y: j });
        }
      }
    }

    if (rawPoints.length > 0) {
      showLoading('Tracing path (' + rawPoints.length + ' points)...');
      setTimeout(() => {
        const ordered = tracePath(rawPoints);
        hideLoading();
        processPoints(ordered);
      }, 50);
    } else {
      hideLoading();
      alert('No dark pixels found in the image. Try an image with a clear dark outline on a light background.');
    }
  }, 50);
}

// ═══ Point Processing ═══
function processPoints(pts) {
  if (!pts || pts.length === 0) return;

  // Center points around (0,0) and scale to fit
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const span = Math.max(maxX - minX, maxY - minY);

  // Scale to fit roughly half the canvas height
  const scaleFactor = (INTERNAL_HEIGHT * 0.45) / span;

  fullPathPoints = pts.map(p => ({
    x: (p.x - midX) * scaleFactor,
    y: (p.y - midY) * scaleFactor
  }));

  // Update UI
  if (pointCountLabel) {
    pointCountLabel.textContent = fullPathPoints.length.toLocaleString();
  }

  switchState(STATE_PREVIEW);
  showApp();
}

// ═══ State Management ═══
function switchState(state) {
  currentState = state;

  if (state === STATE_PREVIEW) {
    previewPanel.classList.remove('hidden');
    controlsPanel.classList.add('hidden');
    isDrawing = false;
    drawingComplete = false;
  } else if (state === STATE_DRAWING) {
    previewPanel.classList.add('hidden');
    controlsPanel.classList.remove('hidden');
    drawingComplete = false;
    initFourier(fullPathPoints);
  }
}

function startDrawing() {
  switchState(STATE_DRAWING);
}

function showLanding() {
  landingPage.style.opacity = '1';
  landingPage.style.visibility = 'visible';
  appContainer.style.opacity = '0';
  appContainer.style.visibility = 'hidden';
  currentState = STATE_LANDING;
  isDrawing = false;
  drawingComplete = false;
  path = [];
  time = 0;
}

function showApp() {
  landingPage.style.opacity = '0';
  landingPage.style.visibility = 'hidden';
  appContainer.style.opacity = '1';
  appContainer.style.visibility = 'visible';
}

function showLoading(message) {
  if (loadingOverlay) {
    const textEl = loadingOverlay.querySelector('.loader-text');
    if (textEl) textEl.textContent = message || 'Processing...';
    loadingOverlay.classList.remove('hidden');
  }
}

function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
  }
}

// ═══ Path Tracing (Improved) ═══
function tracePath(points) {
  if (points.length === 0) return [];

  // Build a simple grid spatial index for faster nearest-neighbor lookup
  const cellSize = 5;
  const grid = new Map();

  function cellKey(x, y) {
    return (Math.floor(x / cellSize)) + ',' + (Math.floor(y / cellSize));
  }

  const remaining = new Set();
  for (let i = 0; i < points.length; i++) {
    remaining.add(i);
    const key = cellKey(points[i].x, points[i].y);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(i);
  }

  const ordered = [];
  let currentIdx = 0;
  remaining.delete(currentIdx);
  ordered.push(points[currentIdx]);

  // Remove from grid
  function removeFromGrid(idx) {
    const key = cellKey(points[idx].x, points[idx].y);
    const arr = grid.get(key);
    if (arr) {
      const pos = arr.indexOf(idx);
      if (pos !== -1) arr.splice(pos, 1);
    }
  }
  removeFromGrid(currentIdx);

  while (remaining.size > 0) {
    const cx = points[currentIdx].x;
    const cy = points[currentIdx].y;
    const gx = Math.floor(cx / cellSize);
    const gy = Math.floor(cy / cellSize);

    let bestIdx = -1;
    let bestDist = Infinity;

    // Search expanding rings of grid cells
    for (let radius = 0; radius <= Math.ceil(bestDist / cellSize) + 1 && radius < 50; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          const key = (gx + dx) + ',' + (gy + dy);
          const cell = grid.get(key);
          if (!cell) continue;
          for (const idx of cell) {
            if (!remaining.has(idx)) continue;
            const d = (points[idx].x - cx) ** 2 + (points[idx].y - cy) ** 2;
            if (d < bestDist) {
              bestDist = d;
              bestIdx = idx;
              if (d < 4) break; // Close enough, stop early
            }
          }
          if (bestDist < 4) break;
        }
        if (bestDist < 4) break;
      }
      if (bestDist < 4 || (radius > 0 && bestIdx !== -1 && radius * cellSize > Math.sqrt(bestDist) * 2)) break;
    }

    // Fallback: linear scan if grid search failed
    if (bestIdx === -1) {
      for (const idx of remaining) {
        const d = (points[idx].x - cx) ** 2 + (points[idx].y - cy) ** 2;
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      }
    }

    if (bestIdx === -1) break;

    remaining.delete(bestIdx);
    removeFromGrid(bestIdx);
    currentIdx = bestIdx;
    ordered.push(points[currentIdx]);
  }

  return ordered;
}

// ═══ Fourier Init ═══
function initFourier(pts) {
  path = [];
  time = 0;
  drawingComplete = false;

  const maxPoints = parseInt(precisionSlider.value);
  const skip = Math.max(1, Math.floor(pts.length / maxPoints));

  const xVals = [];
  const yVals = [];

  for (let i = 0; i < pts.length; i += skip) {
    xVals.push(pts[i].x);
    yVals.push(pts[i].y);
  }

  fourierX = dft(xVals);
  fourierY = dft(yVals);
  fourierX.sort((a, b) => b.amp - a.amp);
  fourierY.sort((a, b) => b.amp - a.amp);
  isDrawing = true;

  statusDisplay.textContent = 'Drawing ' + xVals.length + ' harmonics...';
}

// ═══ Epicycles ═══
function epiCycles(xPos, yPos, rotation, fourier) {
  for (let i = 0; i < fourier.length; i++) {
    const prevx = xPos;
    const prevy = yPos;
    const freq = fourier[i].freq;
    const radius = fourier[i].amp;
    const phase = fourier[i].phase;
    xPos += radius * cos(freq * time + phase + rotation);
    yPos += radius * sin(freq * time + phase + rotation);

    // Circle
    push();
    strokeWeight(0.5);
    stroke(255, 20);
    noFill();
    ellipse(prevx, prevy, radius * 2);

    // Connecting line
    strokeWeight(1);
    stroke(0, 229, 255, 80);
    line(prevx, prevy, xPos, yPos);
    pop();
  }
  return createVector(xPos, yPos);
}

// ═══ Draw Loop ═══
function draw() {
  background(5, 5, 16);

  if (currentState === STATE_PREVIEW) {
    drawPreview();
  } else if (currentState === STATE_DRAWING && isDrawing) {
    drawFourier();
  }
}

function drawPreview() {
  push();
  translate(INTERNAL_WIDTH / 2 + 80, INTERNAL_HEIGHT / 2 + 30);

  // Glow effect
  drawingContext.shadowBlur = 12;
  drawingContext.shadowColor = 'rgba(0, 229, 255, 0.3)';

  stroke(0, 229, 255, 120);
  strokeWeight(1.5);
  noFill();
  beginShape();
  for (const p of fullPathPoints) {
    vertex(p.x, p.y);
  }
  endShape();

  drawingContext.shadowBlur = 0;
  pop();
}

function drawFourier() {
  const DRAW_CENTER_X = INTERNAL_WIDTH / 2 + 130;
  const DRAW_CENTER_Y = INTERNAL_HEIGHT / 2 + 30;

  // Run multiple steps per frame for speed
  for (let s = 0; s < speedMultiplier; s++) {
    if (drawingComplete) break;

    const vx = epiCycles(DRAW_CENTER_X, 80, 0, fourierX);
    const vy = epiCycles(80, DRAW_CENTER_Y, HALF_PI, fourierY);
    const v = createVector(vx.x, vy.y);
    path.unshift(v);

    // Guide lines
    push();
    strokeWeight(0.5);
    stroke(255, 25);
    line(vx.x, vx.y, v.x, v.y);
    line(vy.x, vy.y, v.x, v.y);
    pop();

    const dt = TWO_PI / fourierY.length;
    time += dt;

    // Update progress
    const progress = Math.min((time / TWO_PI) * 100, 100);
    if (progressBar) progressBar.style.width = progress + '%';

    if (time >= TWO_PI) {
      time = TWO_PI; // Clamp
      drawingComplete = true;
      isDrawing = false;
      statusDisplay.textContent = '✓ Drawing complete!';
      if (progressBar) progressBar.style.width = '100%';
      break;
    }
  }

  // Draw the accumulated path
  push();
  beginShape();
  noFill();
  strokeWeight(2);

  // Gradient effect along path
  for (let i = 0; i < path.length; i++) {
    const alpha = map(i, 0, path.length, 255, 40);
    stroke(255, alpha);
    vertex(path[i].x, path[i].y);
  }
  endShape();
  pop();
}

// ═══ Export Functions ═══
function exportToSVG() {
  if (fullPathPoints.length === 0) return;

  // Calculate bounding box for proper viewBox
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of fullPathPoints) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const padding = 20;
  const vbX = minX - padding;
  const vbY = minY - padding;
  const vbW = (maxX - minX) + padding * 2;
  const vbH = (maxY - minY) + padding * 2;

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(vbW)}" height="${Math.round(vbH)}" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">`;
  svgContent += `<rect width="100%" height="100%" fill="#050510"/>`;
  svgContent += `<path d="M ${fullPathPoints[0].x.toFixed(2)} ${fullPathPoints[0].y.toFixed(2)} `;
  for (let i = 1; i < fullPathPoints.length; i++) {
    svgContent += `L ${fullPathPoints[i].x.toFixed(2)} ${fullPathPoints[i].y.toFixed(2)} `;
  }
  svgContent += `" fill="none" stroke="#00e5ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  svgContent += `</svg>`;

  triggerDownload(svgContent, 'fourier-art.svg', 'image/svg+xml');
}

function exportToJSON() {
  if (fullPathPoints.length === 0) return;
  const data = {
    meta: {
      generator: 'Fourier Artisan',
      points: fullPathPoints.length,
      exportedAt: new Date().toISOString()
    },
    path: fullPathPoints
  };
  triggerDownload(JSON.stringify(data, null, 2), 'fourier-path.json', 'application/json');
}

function triggerDownload(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
