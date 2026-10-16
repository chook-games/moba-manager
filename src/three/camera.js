import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { clamp } from '../utils.js';

let inputBound = false;

export function getBattleCenterPoint() {
  const living = [...state.blueChampions, ...state.redChampions].filter((c) => !c.dead);
  if (living.length === 0) return { x: 0, z: 0 };
  let sumX = 0, sumZ = 0;
  living.forEach((c) => { sumX += c.x; sumZ += c.z; });
  return { x: sumX / living.length, z: sumZ / living.length };
}

export function updateCameraPosition() {
  const camera = state.camera;
  if (!camera) return;

  const distScale = 1.0 / Math.pow(state.camZoom, 1.15);
  let focusX = state.camPanOffset.x;
  let focusZ = state.camPanOffset.z;

  const sel = state.selectedChampIndex >= 0 ? state.blueChampions[state.selectedChampIndex] : null;

  if (state.cameraMode === 1) {
    const hero = sel || state.blueChampions[0];
    if (hero && !hero.dead) {
      focusX = hero.x + state.camPanOffset.x;
      focusZ = hero.z + state.camPanOffset.z;
    }
  } else if (state.cameraMode === 2) {
    if (sel && !sel.dead) {
      focusX = sel.x + state.camPanOffset.x;
      focusZ = sel.z + state.camPanOffset.z;
    } else {
      const clash = getBattleCenterPoint();
      focusX = clash.x + state.camPanOffset.x;
      focusZ = clash.z + state.camPanOffset.z;
    }
  }

  const heightY = Math.max(7.5, 48 * distScale);
  const offsetHorizontal = Math.max(8.5, 28 * distScale);

  const desired = new THREE.Vector3(
    focusX + offsetHorizontal * 0.65,
    heightY,
    focusZ + offsetHorizontal * 0.95
  );

  if (state.camShake > 0) {
    const s = state.camShake;
    desired.x += (Math.random() - 0.5) * s * 6;
    desired.y += (Math.random() - 0.5) * s * 8;
    desired.z += (Math.random() - 0.5) * s * 6;
    state.camShake = Math.max(0, state.camShake - 0.05);
  }

  camera.position.lerp(desired, 0.12);
  camera.lookAt(focusX, 0.9, focusZ);
}

export function setCameraPreset(mode) {
  state.cameraMode = mode;
  state.camPanOffset = { x: 0, z: 0 };
  if (mode === 2) setZoomValue(1.95);
  else if (mode === 1) setZoomValue(1.75);
  else setZoomValue(0.80);

  [0, 1, 2].forEach((m) => {
    const btn = document.getElementById(`cam-preset-${m}`);
    if (!btn) return;
    btn.classList.toggle('is-active', m === mode);
  });
}

export function adjustZoom(delta) {
  setZoomValue(state.camZoom + delta);
}

export function setZoomFromSlider(val) {
  setZoomValue(parseFloat(val));
}

export function setZoomValue(newZoom) {
  state.camZoom = clamp(newZoom, CONFIG.CAM_ZOOM_MIN, CONFIG.CAM_ZOOM_MAX);
  const slider = document.getElementById('zoom-range-input');
  if (slider) slider.value = state.camZoom;
  const lbl = document.getElementById('zoom-label');
  if (lbl) lbl.textContent = `${state.camZoom.toFixed(1)}x`;
}

export function setupViewportTouchControls(canvas, handlers = {}) {
  if (inputBound || !canvas) return;
  inputBound = true;

  let isDragging = false;
  let dragDistance = 0;
  let prevX = 0, prevY = 0;
  let initialPinchDist = null;
  let initialZoom = state.camZoom;
  let lastTapTime = 0;

  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();

  canvas.addEventListener('pointerdown', (e) => {
    isDragging = true;
    dragDistance = 0;
    prevX = e.clientX;
    prevY = e.clientY;
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    dragDistance += Math.abs(dx) + Math.abs(dy);
    prevX = e.clientX;
    prevY = e.clientY;

    const panFactor = 0.065 / Math.sqrt(state.camZoom);
    state.camPanOffset.x = clamp(state.camPanOffset.x - dx * panFactor, -CONFIG.CAM_PAN_LIMIT, CONFIG.CAM_PAN_LIMIT);
    state.camPanOffset.z = clamp(state.camPanOffset.z - dy * panFactor, -CONFIG.CAM_PAN_LIMIT, CONFIG.CAM_PAN_LIMIT);
  });

  window.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;

    if (dragDistance < CONFIG.TAP_MAX_DRAG && e.target === canvas) {
      const now = performance.now();
      lastTapTime = now;

      const rect = canvas.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, state.camera);

      // Pick the closest blue champion under the tap (front-most wins).
      let hitIndex = -1;
      let bestDist = Infinity;
      state.blueChampions.forEach((c, idx) => {
        if (c.dead) return;
        const target = c.mesh.userData.hitMesh || c.mesh;
        const hits = raycaster.intersectObject(target, false);
        if (hits.length > 0 && hits[0].distance < bestDist) {
          bestDist = hits[0].distance;
          hitIndex = idx;
        }
      });

      if (hitIndex >= 0) handlers.onSelectHero?.(hitIndex);
      else handlers.onEmptyTap?.();
    }
  });

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist = Math.hypot(dx, dy);
      initialZoom = state.camZoom;
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && initialPinchDist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      setZoomValue(initialZoom * (dist / initialPinchDist));
    }
  }, { passive: true });

  canvas.addEventListener('touchend', () => { initialPinchDist = null; });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    setZoomValue(state.camZoom - e.deltaY * 0.0018);
  }, { passive: false });
}
