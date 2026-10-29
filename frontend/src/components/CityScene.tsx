import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { GameState, HouseState } from '../engine/types';
import { GRID_UNIT } from '../engine/gameEngine';


const CITY_HALF = 5 * GRID_UNIT;

// ----------------------------------------------------------------
// Geometry helpers
// ----------------------------------------------------------------
function makeBuilding(
  h: number,
  color: number,
  x: number,
  z: number,
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(4, h, 4);
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.3,
    roughness: 0.6,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeAgent(color: string): THREE.Group {
  const group = new THREE.Group();
  const c = new THREE.Color(color);

  // Body
  const bodyGeo = new THREE.CapsuleGeometry(0.6, 1.0, 4, 8);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: c,
    emissive: c,
    emissiveIntensity: 0.3,
    metalness: 0.4,
    roughness: 0.4,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.1;
  body.castShadow = true;
  group.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.45, 8, 8);
  const headMat = new THREE.MeshStandardMaterial({
    color: c,
    emissive: c,
    emissiveIntensity: 0.5,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 2.3;
  head.castShadow = true;
  group.add(head);

  // Glow ring
  const ringGeo = new THREE.RingGeometry(0.7, 0.9, 16);
  const ringMat = new THREE.MeshBasicMaterial({
    color: c,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  return group;
}

function makeFireParticles(scene: THREE.Scene, x: number, z: number): () => void {
  const particles: THREE.Mesh[] = [];
  for (let i = 0; i < 30; i++) {
    const geo = new THREE.SphereGeometry(0.15 + Math.random() * 0.25, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(`hsl(${20 + Math.random() * 30}, 100%, 60%)`),
      transparent: true,
      opacity: 0.9,
    });
    const p = new THREE.Mesh(geo, mat);
    p.position.set(
      x + (Math.random() - 0.5) * 3,
      Math.random() * 4,
      z + (Math.random() - 0.5) * 3,
    );
    scene.add(p);
    particles.push(p);
  }

  let frame = 0;
  let rafId: number;
  const animate = () => {
    rafId = requestAnimationFrame(animate);
    frame++;
    particles.forEach((p) => {
      p.position.y += 0.06 + Math.random() * 0.04;
      p.position.x += (Math.random() - 0.5) * 0.05;
      (p.material as THREE.MeshBasicMaterial).opacity -= 0.008;
      p.scale.setScalar(1 + frame * 0.01);
      if ((p.material as THREE.MeshBasicMaterial).opacity <= 0) {
        p.position.y = 0.5;
        (p.material as THREE.MeshBasicMaterial).opacity = 0.9;
        frame = 0;
      }
    });
  };
  animate();

  return () => {
    cancelAnimationFrame(rafId);
    particles.forEach((p) => scene.remove(p));
  };
}

function makeHouseAtPos(
  x: number,
  z: number,
  state: HouseState,
  agentColor: string,
): THREE.Group {
  const group = new THREE.Group();

  const wallColor =
    state === 'INTACT'
      ? 0x4a5568
      : state === 'ON_FIRE'
        ? 0x7c2d12
        : 0x374151;

  // House body
  const bodyGeo = new THREE.BoxGeometry(3, 2.5, 3);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: wallColor,
    metalness: 0.1,
    roughness: 0.8,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.25;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Roof
  const roofGeo = new THREE.ConeGeometry(2.3, 1.5, 4);
  const roofColor = new THREE.Color(agentColor);
  const roofMat = new THREE.MeshStandardMaterial({
    color: roofColor,
    emissive: roofColor,
    emissiveIntensity: 0.15,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 3.25;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  group.position.set(x, 0, z);
  return group;
}

// ----------------------------------------------------------------
// Main 3D Scene Component
// ----------------------------------------------------------------
interface CitySceneProps {
  gameState: GameState;
  width: number;
  height: number;
}

export default function CityScene({ gameState, width, height }: CitySceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const agentMeshesRef = useRef<Record<string, THREE.Group>>({});
  const houseMeshesRef = useRef<Record<string, THREE.Group>>({});
  const fireCleanupRef = useRef<Record<string, () => void>>({});
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, dragging: false, lastX: 0, lastY: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 120 });

  // ---- INIT SCENE ----
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a1a');
    scene.fog = new THREE.FogExp2('#0a0a1a', 0.008);
    sceneRef.current = scene;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const a = cameraAngleRef.current;
    camera.position.set(
      a.radius * Math.sin(a.phi) * Math.cos(a.theta),
      a.radius * Math.cos(a.phi),
      a.radius * Math.sin(a.phi) * Math.sin(a.theta),
    );
    camera.lookAt(CITY_HALF, 0, CITY_HALF);
    cameraRef.current = camera;

    // Lights
    const ambient = new THREE.AmbientLight(0x111133, 0.8);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffd4a0, 1.5);
    sun.position.set(50, 80, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.setScalar(2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 300;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    scene.add(sun);

    const blueFill = new THREE.DirectionalLight(0x4444ff, 0.4);
    blueFill.position.set(-50, 30, -50);
    scene.add(blueFill);

    const pointRed = new THREE.PointLight(0xff3300, 2, 60);
    pointRed.position.set(CITY_HALF - 20, 15, CITY_HALF);
    scene.add(pointRed);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(200, 200, 30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0d1117,
      metalness: 0.0,
      roughness: 1.0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.set(CITY_HALF, 0, CITY_HALF);
    scene.add(ground);

    // Grid lines
    const gridHelper = new THREE.GridHelper(
      10 * GRID_UNIT,
      10,
      0x1e293b,
      0x1e293b,
    );
    gridHelper.position.set(CITY_HALF, 0.01, CITY_HALF);
    scene.add(gridHelper);

    // Background city skyline (decorative buildings)
    const bgColors = [0x1e3a5f, 0x1a2e4a, 0x162544, 0x0f1b30];
    for (let i = 0; i < 40; i++) {
      const h = 10 + Math.random() * 35;
      const bx = (Math.random() - 0.5) * 180 + CITY_HALF;
      const bz = (Math.random() - 0.5) * 180 + CITY_HALF;
      if (Math.abs(bx - CITY_HALF) < 50 && Math.abs(bz - CITY_HALF) < 50) continue;
      const col = bgColors[Math.floor(Math.random() * bgColors.length)];
      const b = makeBuilding(h, col, bx, bz);
      scene.add(b);
    }

    // City Center landmark
    const ccGeo = new THREE.CylinderGeometry(4, 5, 8, 8);
    const ccMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.2,
    });
    const cc = new THREE.Mesh(ccGeo, ccMat);
    cc.position.set(4 * GRID_UNIT, 4, 4 * GRID_UNIT);
    cc.castShadow = true;
    scene.add(cc);
    const ccLight = new THREE.PointLight(0xffd700, 3, 30);
    ccLight.position.set(4 * GRID_UNIT, 12, 4 * GRID_UNIT);
    scene.add(ccLight);

    // Energy bank
    const ebGeo = new THREE.OctahedronGeometry(3);
    const ebMat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00ffcc,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1,
    });
    const eb = new THREE.Mesh(ebGeo, ebMat);
    eb.position.set(5 * GRID_UNIT, 5, 5 * GRID_UNIT);
    scene.add(eb);
    const ebLight = new THREE.PointLight(0x00ffcc, 2, 25);
    ebLight.position.set(5 * GRID_UNIT, 8, 5 * GRID_UNIT);
    scene.add(ebLight);

    // Render loop
    let frameCount = 0;
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      frameCount++;

      // Rotate energy bank
      eb.rotation.y += 0.02;
      eb.rotation.x += 0.01;

      // Pulsate city center light
      ccLight.intensity = 2.5 + Math.sin(frameCount * 0.05) * 0.5;

      renderer.render(scene, camera);
    };
    loop();

    // Mouse camera orbit
    const onMouseDown = (e: MouseEvent) => {
      mouseRef.current.dragging = true;
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };
    const onMouseUp = () => {
      mouseRef.current.dragging = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.dragging) return;
      const dx = e.clientX - mouseRef.current.lastX;
      const dy = e.clientY - mouseRef.current.lastY;
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
      const a = cameraAngleRef.current;
      a.theta -= dx * 0.005;
      a.phi = Math.max(0.2, Math.min(Math.PI / 2.2, a.phi + dy * 0.005));
      const cam = cameraRef.current!;
      cam.position.set(
        CITY_HALF + a.radius * Math.sin(a.phi) * Math.cos(a.theta),
        a.radius * Math.cos(a.phi),
        CITY_HALF + a.radius * Math.sin(a.phi) * Math.sin(a.theta),
      );
      cam.lookAt(CITY_HALF, 0, CITY_HALF);
    };
    const onWheel = (e: WheelEvent) => {
      const a = cameraAngleRef.current;
      a.radius = Math.max(40, Math.min(220, a.radius + e.deltaY * 0.2));
      const cam = cameraRef.current!;
      cam.position.set(
        CITY_HALF + a.radius * Math.sin(a.phi) * Math.cos(a.theta),
        a.radius * Math.cos(a.phi),
        CITY_HALF + a.radius * Math.sin(a.phi) * Math.sin(a.theta),
      );
      cam.lookAt(CITY_HALF, 0, CITY_HALF);
    };

    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    mount.addEventListener('wheel', onWheel);

    return () => {
      cancelAnimationFrame(rafRef.current);
      mount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      mount.removeEventListener('wheel', onWheel);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  // ---- SYNC AGENTS ----
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    Object.entries(gameState.agents).forEach(([id, agent]) => {
      if (!agentMeshesRef.current[id]) {
        const mesh = makeAgent(agent.color);
        scene.add(mesh);
        agentMeshesRef.current[id] = mesh;
      }
      const mesh = agentMeshesRef.current[id];
      mesh.position.set(agent.x, 0, agent.z);
      mesh.visible = agent.alive;

      // Bob up and down when walking
      if (agent.animState === 'walking') {
        mesh.position.y = Math.sin(Date.now() * 0.01) * 0.2;
      } else if (agent.animState === 'attacking') {
        mesh.position.y = Math.sin(Date.now() * 0.05) * 0.5;
        mesh.rotation.y += 0.3;
      } else if (!agent.alive) {
        mesh.position.y = -1;
        mesh.rotation.x = Math.PI / 2;
      }
    });

    // Remove dead agent meshes cleanly
    Object.entries(agentMeshesRef.current).forEach(([id]) => {
      if (!gameState.agents[id]) {
        scene.remove(agentMeshesRef.current[id]);
        delete agentMeshesRef.current[id];
      }
    });
  }, [gameState.agents]);

  // ---- SYNC HOUSES ----
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    Object.entries(gameState.agents).forEach(([id, agent]) => {
      const state = gameState.houseStates[id] || 'INTACT';

      if (houseMeshesRef.current[id]) {
        scene.remove(houseMeshesRef.current[id]);
      }
      const house = makeHouseAtPos(agent.homeX, agent.homeZ, state, agent.color);
      scene.add(house);
      houseMeshesRef.current[id] = house;

      // Fire particles
      if (state === 'ON_FIRE' && !fireCleanupRef.current[id]) {
        fireCleanupRef.current[id] = makeFireParticles(
          scene,
          agent.homeX,
          agent.homeZ,
        );
      } else if (state !== 'ON_FIRE' && fireCleanupRef.current[id]) {
        fireCleanupRef.current[id]();
        delete fireCleanupRef.current[id];
      }
    });
  }, [gameState.houseStates, gameState.agents]);

  // ---- RESIZE ----
  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }, [width, height]);

  return (
    <div
      ref={mountRef}
      style={{ width, height, cursor: 'grab', userSelect: 'none' }}
    />
  );
}
