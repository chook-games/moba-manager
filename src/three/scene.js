import { state } from '../state.js';
import { CONFIG } from '../config.js';

export function initThreeScene() {
  if (state.isThreeInitialized) return;
  state.isThreeInitialized = true;

  const canvas = document.getElementById('three-canvas');
  const container = document.getElementById('viewport-container');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111a24);
  scene.fog = new THREE.FogExp2(0x111a24, 0.0085);

  const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 1, 300);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;

  scene.add(new THREE.AmbientLight(0x94a3b8, 0.85));

  const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.95);
  dirLight.position.set(25, 55, 30);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const bluePoint = new THREE.PointLight(0x06b6d4, 1.2, 35);
  bluePoint.position.set(-25, 6, 25);
  scene.add(bluePoint);

  const redPoint = new THREE.PointLight(0xf43f5e, 1.2, 35);
  redPoint.position.set(25, 6, -25);
  scene.add(redPoint);

  state.scene = scene;
  state.camera = camera;
  state.renderer = renderer;
  state.worldGroup = new THREE.Group();
  state.unitsGroup = new THREE.Group();
  state.projectilesGroup = new THREE.Group();
  state.effectsGroup = new THREE.Group();

  scene.add(state.worldGroup, state.unitsGroup, state.projectilesGroup, state.effectsGroup);

  buildAramBridgeEnvironment();
  window.addEventListener('resize', handleResize);
}

function buildAramBridgeEnvironment() {
  const bridgeLength = CONFIG.BRIDGE_LENGTH;
  const bridgeWidth = CONFIG.BRIDGE_WIDTH;

  const bridgeGroup = new THREE.Group();
  bridgeGroup.rotation.y = Math.PI / 4;

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(bridgeLength, 2.2, bridgeWidth),
    new THREE.MeshStandardMaterial({ color: 0x263832, roughness: 0.85, metalness: 0.1 })
  );
  deck.position.y = -1.1;
  deck.receiveShadow = true;
  bridgeGroup.add(deck);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(bridgeLength - 6, bridgeWidth - 2.4),
    new THREE.MeshStandardMaterial({ color: 0x2d443b, roughness: 0.9 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.02;
  bridgeGroup.add(road);

  const railGeo = new THREE.BoxGeometry(bridgeLength - 4, 0.55, 0.55);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x5c2d24, roughness: 0.6 });
  const leftRail = new THREE.Mesh(railGeo, railMat);
  leftRail.position.set(0, 0.28, -bridgeWidth / 2 + 0.3);
  bridgeGroup.add(leftRail);
  const rightRail = new THREE.Mesh(railGeo, railMat);
  rightRail.position.set(0, 0.28, bridgeWidth / 2 - 0.3);
  bridgeGroup.add(rightRail);

  const midLine = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, bridgeWidth - 2),
    new THREE.MeshBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.45 })
  );
  midLine.rotation.x = -Math.PI / 2;
  midLine.position.y = 0.04;
  bridgeGroup.add(midLine);

  [-8, 8].forEach((xPos) => {
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.15, 16),
      new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.35 })
    );
    pad.position.set(xPos, 0.08, -bridgeWidth / 2 + 1.4);
    bridgeGroup.add(pad);
  });

  state.worldGroup.add(bridgeGroup);
}

export function handleResize() {
  if (!state.renderer || !state.camera) return;
  const container = document.getElementById('viewport-container');
  if (!container || container.clientWidth === 0 || container.clientHeight === 0) return;
  state.camera.aspect = container.clientWidth / container.clientHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(container.clientWidth, container.clientHeight);
}
