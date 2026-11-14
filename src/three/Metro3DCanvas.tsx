import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DFA_ORDER, DFA_STATIONS, DfaStateId, NFA_STATIONS, NfaState } from '../data/automataData';
import { REGEX_LIBRARY, RegexPatternId } from '../data/regexLibraryData';
import { DEFAULT_EXERCISE_BUNDLE, SolvedMethodBundle } from '../engine/automataMethodEngine';
import {
  buildCdmxLandmarks,
  buildGhostCloneToken,
  buildMetroStation,
  buildMetroTrain,
  buildMinimal3DLabel,
} from './metroModels';
import { createContactShadowTexture, createUrbanPlazaTexture } from './proceduralTextures';

export type SceneNetworkMode = 'nfa' | 'dfa' | 'library';

export interface Metro3DCanvasProps {
  networkMode: SceneNetworkMode;
  activeNfaStates: string[];
  activeDfaState: string | null;
  libraryPatternId: RegexPatternId;
  bundle?: SolvedMethodBundle;
  focusStationId?: string | null;
  isTitleScreen: boolean;
  onStationClick?: (stationId: string) => void;
}

// Module-scope scratch math helpers (zero GC inside animation loop)
const _leadPos = new THREE.Vector3();
const _leadTangent = new THREE.Vector3();
const _trailerPos = new THREE.Vector3();
const _trailerTangent = new THREE.Vector3();
const _bellowsPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _beadPos = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

const TRAIN_RAIL_Z_OFFSET = 2.15;
const TRAIN_RAIL_Y = 0.24;

interface NodeCoords {
  id: string;
  label: string;
  x: number;
  z: number;
  variant: 'normal' | 'accept' | 'deadend' | 'start';
}

interface EdgeSpec {
  from: string;
  to: string;
  kind: 'train' | 'walk' | 'dead';
  curve?: 'top' | 'bottom' | 'straight' | 'self';
  symbol: string;
  caption: string;
}

interface AnimatedWalkBridge {
  curve: THREE.CatmullRomCurve3;
  beads: THREE.Mesh[];
}

function getLayoutForMode(
  mode: SceneNetworkMode,
  libraryPatternId: RegexPatternId,
  bundle: SolvedMethodBundle = DEFAULT_EXERCISE_BUNDLE
): { nodes: NodeCoords[]; edges: EdgeSpec[] } {
  if (mode === 'nfa') {
    if (bundle.spec.id === 'a2-ab-astar') {
      const order: NfaState[] = ['A', 'B', 'C', 'D', 'E', 'F'];
      const nodes: NodeCoords[] = order.map((id, idx) => {
        const meta = NFA_STATIONS[id];
        return {
          id,
          label: meta.metroName,
          x: (idx - 2.5) * 6.4,
          z: 0,
          variant: id === 'A' ? 'start' : id === 'F' ? 'accept' : 'normal',
        };
      });
      const edges: EdgeSpec[] = [
        { from: 'A', to: 'B', kind: 'train', curve: 'straight', symbol: 'a', caption: 'Tren boleto "a"' },
        { from: 'B', to: 'C', kind: 'train', curve: 'straight', symbol: 'b', caption: 'Tren boleto "b"' },
        { from: 'C', to: 'D', kind: 'walk', curve: 'straight', symbol: 'ε', caption: 'Pasillo gratis' },
        { from: 'D', to: 'E', kind: 'train', curve: 'straight', symbol: 'a', caption: 'Tren bucle a*' },
        { from: 'E', to: 'F', kind: 'walk', curve: 'straight', symbol: 'ε', caption: 'Salida gratis' },
        { from: 'E', to: 'D', kind: 'walk', curve: 'top', symbol: 'ε', caption: 'Retorno bucle' },
        { from: 'C', to: 'F', kind: 'walk', curve: 'bottom', symbol: 'ε', caption: 'Atajo directo' },
      ];
      return { nodes, edges };
    }

    const { nfaLayout, stations } = bundle;
    const nodes: NodeCoords[] = nfaLayout.nodes.map((n) => ({
      id: n.id,
      label: stations[n.id]?.metroName ?? n.id,
      x: (n.x - nfaLayout.width / 2) * 0.048,
      z: (n.y - nfaLayout.height / 2) * 0.055,
      variant: n.isStart ? 'start' : n.isAccept ? 'accept' : 'normal',
    }));
    const edges: EdgeSpec[] = nfaLayout.edges.map((e) => ({
      from: e.from,
      to: e.to,
      kind: e.kind,
      curve: e.curve,
      symbol: e.label,
      caption: e.kind === 'walk' ? 'Pasillo gratis' : `Tren "${e.label}"`,
    }));
    return { nodes, edges };
  }

  if (mode === 'dfa') {
    if (bundle.spec.id === 'a2-ab-astar') {
      const coords: Record<DfaStateId, { x: number; z: number }> = {
        '[A]': { x: -8.0, z: -6.2 },
        '[B]': { x: 4.8, z: -6.2 },
        '[∅]': { x: 0, z: 0.4 },
        '[C,D,F]': { x: 8.2, z: 7.2 },
        '[E,D,F]': { x: -7.2, z: 7.2 },
      };
      const nodes: NodeCoords[] = DFA_ORDER.map((id) => {
        const st = DFA_STATIONS[id];
        return {
          id,
          label: st.subtitle.split('·')[0].trim(),
          x: coords[id].x,
          z: coords[id].z,
          variant: st.isStart ? 'start' : st.ef === '1' ? 'accept' : st.isDeadEnd ? 'deadend' : 'normal',
        };
      });
      const edges: EdgeSpec[] = [
        { from: '[A]', to: '[B]', kind: 'train', curve: 'straight', symbol: 'a', caption: 'Vía boleto "a"' },
        { from: '[A]', to: '[∅]', kind: 'dead', curve: 'straight', symbol: 'b', caption: 'Error → Pozo' },
        { from: '[B]', to: '[∅]', kind: 'dead', curve: 'straight', symbol: 'a', caption: 'Error → Pozo' },
        { from: '[B]', to: '[C,D,F]', kind: 'train', curve: 'straight', symbol: 'b', caption: 'Vía boleto "b"' },
        { from: '[C,D,F]', to: '[E,D,F]', kind: 'train', curve: 'straight', symbol: 'a', caption: 'Entra bucle' },
        { from: '[C,D,F]', to: '[∅]', kind: 'dead', curve: 'straight', symbol: 'b', caption: 'Error → Pozo' },
        { from: '[E,D,F]', to: '[∅]', kind: 'dead', curve: 'straight', symbol: 'b', caption: 'Error → Pozo' },
        { from: '[E,D,F]', to: '[E,D,F]', kind: 'train', curve: 'bottom', symbol: 'a', caption: 'Bucle a*' },
      ];
      return { nodes, edges };
    }

    const { dfaLayout, dfaRows } = bundle;
    const nodes: NodeCoords[] = dfaLayout.nodes.map((n) => {
      const row = dfaRows[n.id];
      return {
        id: n.id,
        label: row?.subtitle?.split('·')[0].trim() ?? n.id,
        x: (n.x - dfaLayout.width / 2) * 0.044,
        z: (n.y - dfaLayout.height / 2) * 0.046,
        variant: n.isStart ? 'start' : n.isAccept ? 'accept' : n.isDeadEnd ? 'deadend' : 'normal',
      };
    });
    const edges: EdgeSpec[] = dfaLayout.edges.map((e) => ({
      from: e.from,
      to: e.to,
      kind: e.kind,
      curve: e.curve,
      symbol: e.label,
      caption: e.kind === 'dead' ? 'Error → Pozo' : `Vía "${e.label}"`,
    }));
    return { nodes, edges };
  }

  // Library preview mode
  const pat = REGEX_LIBRARY.find((p) => p.id === libraryPatternId) ?? REGEX_LIBRARY[0];
  const nodes: NodeCoords[] = pat.nodes.map((n) => ({
    id: n.id,
    label: n.isAccept ? 'Salida' : n.isStart ? 'Inicio' : 'Andén',
    x: (n.x - 270) * 0.072,
    z: (n.y - 120) * 0.072,
    variant: n.isStart ? 'start' : n.isAccept ? 'accept' : 'normal',
  }));
  const edges: EdgeSpec[] = pat.edges.map((e) => ({
    from: e.from,
    to: e.to,
    kind: e.kind,
    curve: e.curve,
    symbol: e.label,
    caption: e.kind === 'walk' ? 'Pasillo gratis' : `Vía "${e.label}"`,
  }));
  return { nodes, edges };
}

export const Metro3DCanvas: React.FC<Metro3DCanvasProps> = ({
  networkMode,
  activeNfaStates,
  activeDfaState,
  libraryPatternId,
  bundle = DEFAULT_EXERCISE_BUNDLE,
  focusStationId,
  isTitleScreen,
  onStationClick,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const propsRef = useRef({
    networkMode,
    activeNfaStates,
    activeDfaState,
    libraryPatternId,
    bundle,
    focusStationId,
    isTitleScreen,
    onStationClick,
  });
  propsRef.current = {
    networkMode,
    activeNfaStates,
    activeDfaState,
    libraryPatternId,
    bundle,
    focusStationId,
    isTitleScreen,
    onStationClick,
  };

  const rebuildNetworkRef = useRef<(() => void) | null>(null);
  const triggerCameraFocusRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    rebuildNetworkRef.current?.();
  }, [networkMode, libraryPatternId, bundle]);

  useEffect(() => {
    triggerCameraFocusRef.current?.();
  }, [networkMode, activeNfaStates, activeDfaState, focusStationId, isTitleScreen]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    // Crisp high-altitude CDMX morning sky atmosphere
    const horizonColor = 0xe9f0f7;
    scene.background = new THREE.Color(horizonColor);
    scene.fog = new THREE.FogExp2(horizonColor, 0.0115);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTex = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTex;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      45,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.5,
      200
    );
    camera.position.set(0, 16, 26);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.12;
    controls.minDistance = 8;
    controls.maxDistance = 52;

    let userControlling = false;
    let scriptedCamActive = true;
    controls.addEventListener('start', () => {
      userControlling = true;
      scriptedCamActive = false;
    });
    controls.addEventListener('end', () => {
      userControlling = false;
    });

    // Studio Warm Valley-of-Mexico Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x64748b, 0.78);
    hemiLight.position.set(0, 34, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.0);
    keyLight.position.set(18, 28, 16);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 75;
    const d = 28;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.68);
    rimLight.position.set(-20, 14, -18);
    scene.add(rimLight);

    // Extended CDMX Architectural Urban Esplanade Ground
    const plazaTex = createUrbanPlazaTexture(maxAniso);
    const groundGeo = new THREE.PlaneGeometry(180, 180);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      map: plazaTex,
      roughness: 0.9,
      metalness: 0.03,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Iconic CDMX Skyline Landmarks (Torre Latinoamericana, Revolución, Ángel)
    const landmarks = buildCdmxLandmarks(maxAniso);
    scene.add(landmarks.group);

    // CDMX Jacarandas & Green Perimeter Trees via InstancedMesh
    const treeCount = 44;
    const trunkGeo = new THREE.CylinderGeometry(0.13, 0.2, 1.45, 8);
    trunkGeo.translate(0, 0.72, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const trunkInstances = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);

    const crownGeo = new THREE.DodecahedronGeometry(1.05, 1);
    crownGeo.translate(0, 2.2, 0);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
    const crownInstances = new THREE.InstancedMesh(crownGeo, crownMat, treeCount);

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2;
      const radius = 24 + (i % 3) * 4.2;
      const tx = Math.cos(angle) * radius * 1.25;
      const tz = Math.sin(angle) * radius * 0.88;
      const s = 0.85 + ((i * 37) % 30) / 100;

      _dummy.position.set(tx, 0, tz);
      _dummy.rotation.y = i * 0.7;
      _dummy.scale.set(s, s, s);
      _dummy.updateMatrix();
      trunkInstances.setMatrixAt(i, _dummy.matrix);
      crownInstances.setMatrixAt(i, _dummy.matrix);

      // Authentic CDMX spring mix: ~55% purple Jacarandas, ~45% urban ash trees
      if (i % 9 < 5) {
        _color.setHSL(0.76 + (i % 3) * 0.015, 0.68, 0.56 + (i % 2) * 0.06);
      } else {
        _color.setHSL(0.26 + ((i % 4) - 1) * 0.015, 0.45, 0.36 + (i % 3) * 0.04);
      }
      crownInstances.setColorAt(i, _color);
    }
    trunkInstances.instanceMatrix.needsUpdate = true;
    crownInstances.instanceMatrix.needsUpdate = true;
    if (crownInstances.instanceColor) crownInstances.instanceColor.needsUpdate = true;
    trunkInstances.computeBoundingSphere();
    crownInstances.computeBoundingSphere();
    scene.add(trunkInstances, crownInstances);

    // CDMX Urban Streetlights (InstancedMesh)
    const lampCount = 16;
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.09, 3.6, 8);
    poleGeo.translate(0, 1.8, 0);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.75 });
    const poleInstances = new THREE.InstancedMesh(poleGeo, poleMat, lampCount);

    const bulbGeo = new THREE.SphereGeometry(0.18, 10, 10);
    bulbGeo.translate(0, 3.65, 0);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfde047,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });
    const bulbInstances = new THREE.InstancedMesh(bulbGeo, bulbMat, lampCount);

    for (let i = 0; i < lampCount; i++) {
      const lx = (i % 8 - 3.5) * 6.4;
      const lz = i < 8 ? -10.5 : 12.2;
      _dummy.position.set(lx, 0, lz);
      _dummy.rotation.y = 0;
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      poleInstances.setMatrixAt(i, _dummy.matrix);
      bulbInstances.setMatrixAt(i, _dummy.matrix);
    }
    poleInstances.instanceMatrix.needsUpdate = true;
    bulbInstances.instanceMatrix.needsUpdate = true;
    poleInstances.computeBoundingSphere();
    bulbInstances.computeBoundingSphere();
    scene.add(poleInstances, bulbInstances);

    const shadowTex = createContactShadowTexture();

    // Articulated 2-Car Hero Metro CDMX Train
    const trainAsset = buildMetroTrain(shadowTex, maxAniso);
    scene.add(trainAsset.leadGroup, trainAsset.trailerGroup, trainAsset.bellowsMesh);

    // 8 Reusable Ghost Clone Tokens (for ε cloning visualization)
    const ghostTokens = Array.from({ length: 8 }, () => {
      const tok = buildGhostCloneToken();
      tok.group.visible = false;
      scene.add(tok.group);
      return tok;
    });

    // Dynamic Network Group
    const networkGroup = new THREE.Group();
    scene.add(networkGroup);

    let stationCoordsMap = new Map<string, THREE.Vector3>();
    let edgeCurvesMap = new Map<string, THREE.CatmullRomCurve3>();
    let animatedWalkBridges: AnimatedWalkBridge[] = [];
    let clickableProxies: THREE.Object3D[] = [];
    let networkDisposers: (() => void)[] = [];
    let activeBeaconMeshes: Map<string, THREE.Mesh> = new Map();

    // Train motion state machine
    let currentStationId: string | null = null;
    let targetStationId: string | null = null;
    let activeTrainCurve: THREE.CatmullRomCurve3 | null = null;
    let isTempCurve = false;
    let curveProgress = 1;
    let isTrainMoving = false;
    let doorOpenProgress = 1;
    const parkForwardDir = new THREE.Vector3(1, 0, 0);

    const snapTrainToStation = (stId: string | null) => {
      const pos = stId ? stationCoordsMap.get(stId) : undefined;
      if (!pos) return;
      currentStationId = stId;
      targetStationId = stId;
      activeTrainCurve = null;
      curveProgress = 1;
      isTrainMoving = false;
      doorOpenProgress = 1;

      parkForwardDir.set(1, 0, 0);
      trainAsset.leadGroup.position.set(pos.x + 1.15, TRAIN_RAIL_Y, pos.z + TRAIN_RAIL_Z_OFFSET);
      trainAsset.leadGroup.rotation.set(0, Math.PI / 2, 0);

      trainAsset.trailerGroup.position.set(pos.x - 1.55, TRAIN_RAIL_Y, pos.z + TRAIN_RAIL_Z_OFFSET);
      trainAsset.trailerGroup.rotation.set(0, Math.PI / 2, 0);

      trainAsset.bellowsMesh.position.set(pos.x - 0.2, TRAIN_RAIL_Y + 0.72, pos.z + TRAIN_RAIL_Z_OFFSET);
      trainAsset.bellowsMesh.rotation.set(0, Math.PI / 2, 0);
    };

    const clearNetwork = () => {
      networkDisposers.forEach((fn) => fn());
      networkDisposers = [];
      clickableProxies = [];
      activeBeaconMeshes.clear();
      edgeCurvesMap.clear();
      animatedWalkBridges = [];
      while (networkGroup.children.length > 0) {
        networkGroup.remove(networkGroup.children[0]);
      }
      stationCoordsMap = new Map();
    };

    const buildNetwork = () => {
      clearNetwork();
      const {
        networkMode: mode,
        libraryPatternId: patId,
        bundle: activeBundle,
        activeNfaStates: nfaStates,
        activeDfaState: dfaState,
      } = propsRef.current;
      const layout = getLayoutForMode(mode, patId, activeBundle);

      // 1. Build Metro CDMX Stations
      layout.nodes.forEach((n) => {
        const built = buildMetroStation({
          id: n.id,
          label: n.label,
          x: n.x,
          z: n.z,
          variant: n.variant,
          maxAnisotropy: maxAniso,
          shadowTexture: shadowTex,
        });
        networkGroup.add(built.group);
        clickableProxies.push(built.proxyCollider);
        activeBeaconMeshes.set(n.id, built.beaconRing);
        stationCoordsMap.set(n.id, new THREE.Vector3(n.x, 0.36, n.z));
        networkDisposers.push(built.dispose);
      });

      // 2. Shared Materials for STC Rails, Concrete Track Beds, and Glass Skybridges
      const ballastMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.92,
        metalness: 0.06,
      });
      const sleeperMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.88,
        metalness: 0.08,
      });
      const line1PinkRailMat = new THREE.MeshStandardMaterial({
        color: 0xf04e98,
        emissive: 0x9d174d,
        emissiveIntensity: 0.18,
        roughness: 0.3,
        metalness: 0.45,
      });
      const line2BlueRailMat = new THREE.MeshStandardMaterial({
        color: 0x005eb8,
        emissive: 0x1e3a8a,
        emissiveIntensity: 0.2,
        roughness: 0.3,
        metalness: 0.45,
      });
      const trainRailMat = new THREE.MeshStandardMaterial({
        color: 0xf26522,
        roughness: 0.32,
        metalness: 0.55,
      });
      const deadRailMat = new THREE.MeshStandardMaterial({
        color: 0xe11d48,
        roughness: 0.42,
        metalness: 0.35,
      });
      const bridgeFloorMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.45,
        roughness: 0.22,
        metalness: 0.25,
      });
      const glassBridgeMat = new THREE.MeshStandardMaterial({
        color: 0x6ee7b7,
        emissive: 0x10b981,
        emissiveIntensity: 0.26,
        roughness: 0.12,
        metalness: 0.15,
        transparent: true,
        opacity: 0.42,
      });
      const beadMat = new THREE.MeshStandardMaterial({
        color: 0xd1fae5,
        emissive: 0x34d399,
        emissiveIntensity: 1.9,
        roughness: 0.1,
      });
      const beadGeo = new THREE.SphereGeometry(0.15, 10, 10);
      const sleeperGeo = new THREE.BoxGeometry(1.15, 0.08, 0.22);

      networkDisposers.push(() => {
        ballastMat.dispose();
        sleeperMat.dispose();
        line1PinkRailMat.dispose();
        line2BlueRailMat.dispose();
        trainRailMat.dispose();
        deadRailMat.dispose();
        bridgeFloorMat.dispose();
        glassBridgeMat.dispose();
        beadMat.dispose();
        beadGeo.dispose();
        sleeperGeo.dispose();
      });

      // Collect sleeper transforms for single InstancedMesh
      const sleeperMatrices: THREE.Matrix4[] = [];
      const tempObj = new THREE.Object3D();
      const tangentVec = new THREE.Vector3();

      // 3. Build Track Curves & Elevated Skybridges
      layout.edges.forEach((edge) => {
        const pFrom = stationCoordsMap.get(edge.from);
        const pTo = stationCoordsMap.get(edge.to);
        if (!pFrom || !pTo) return;

        if (edge.kind === 'walk') {
          // Elevated ε Pedestrian Skybridge (enclosed translucent glass tube + flowing light beads)
          let walkCurve: THREE.CatmullRomCurve3;
          if (edge.curve === 'top') {
            const mx = (pFrom.x + pTo.x) / 2;
            walkCurve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(pFrom.x, 2.55, pFrom.z - 0.8),
              new THREE.Vector3(mx, 3.85, pFrom.z - 4.6),
              new THREE.Vector3(pTo.x, 2.55, pTo.z - 0.8),
            ]);
          } else if (edge.curve === 'bottom') {
            const mx = (pFrom.x + pTo.x) / 2;
            walkCurve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(pFrom.x, 2.55, pFrom.z - 0.6),
              new THREE.Vector3(mx, 4.15, pFrom.z - 6.6),
              new THREE.Vector3(pTo.x, 2.55, pTo.z - 0.6),
            ]);
          } else {
            walkCurve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(pFrom.x, 2.55, pFrom.z - 0.55),
              new THREE.Vector3((pFrom.x + pTo.x) / 2, 2.95, (pFrom.z + pTo.z) / 2 - 0.55),
              new THREE.Vector3(pTo.x, 2.55, pTo.z - 0.55),
            ]);
          }

          const coreGeo = new THREE.TubeGeometry(walkCurve, 34, 0.11, 8, false);
          const shellGeo = new THREE.TubeGeometry(walkCurve, 34, 0.28, 10, false);
          const coreMesh = new THREE.Mesh(coreGeo, bridgeFloorMat);
          const shellMesh = new THREE.Mesh(shellGeo, glassBridgeMat);
          networkGroup.add(coreMesh, shellMesh);

          const beads = [0, 1, 2].map(() => {
            const b = new THREE.Mesh(beadGeo, beadMat);
            networkGroup.add(b);
            return b;
          });
          animatedWalkBridges.push({ curve: walkCurve, beads });
          edgeCurvesMap.set(`${edge.from}->${edge.to}`, walkCurve);

          networkDisposers.push(() => {
            coreGeo.dispose();
            shellGeo.dispose();
          });

          // Minimalist label above ε skybridge
          const midWalkPt = walkCurve.getPointAt(0.5);
          midWalkPt.y += 0.55;
          const walkLbl = buildMinimal3DLabel({
            symbol: edge.symbol,
            caption: edge.caption,
            accentColor: '#10b981',
            position: midWalkPt,
            scale: 0.78,
            maxAnisotropy: maxAniso,
          });
          networkGroup.add(walkLbl.group);
          networkDisposers.push(walkLbl.dispose);
        } else {
          // Ground-level Railway Track routed along platform boarding edge (+TRAIN_RAIL_Z_OFFSET)
          const az = pFrom.z + TRAIN_RAIL_Z_OFFSET;
          const bz = pTo.z + TRAIN_RAIL_Z_OFFSET;
          let railCurve: THREE.CatmullRomCurve3;

          if (edge.from === edge.to) {
            // Self-loop siding arc (e.g., [E,D,F] loop on "a")
            railCurve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(pFrom.x + 1.15, TRAIN_RAIL_Y, az),
              new THREE.Vector3(pFrom.x + 3.2, TRAIN_RAIL_Y, az + 2.6),
              new THREE.Vector3(pFrom.x, TRAIN_RAIL_Y, az + 4.8),
              new THREE.Vector3(pFrom.x - 3.2, TRAIN_RAIL_Y, az + 2.6),
              new THREE.Vector3(pFrom.x - 1.15, TRAIN_RAIL_Y, az),
            ]);
          } else {
            const mx = (pFrom.x + pTo.x) / 2;
            const mz = (az + bz) / 2;
            const arcDip =
              edge.curve === 'top'
                ? -2.5
                : edge.curve === 'bottom'
                ? 2.5
                : edge.kind === 'dead'
                ? 1.2
                : 0;
            railCurve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(pFrom.x, TRAIN_RAIL_Y, az),
              new THREE.Vector3(mx, TRAIN_RAIL_Y, mz + arcDip),
              new THREE.Vector3(pTo.x, TRAIN_RAIL_Y, bz),
            ]);
          }

          edgeCurvesMap.set(`${edge.from}->${edge.to}`, railCurve);

          // Concrete ballast bed + central STC guideway beam
          const bedGeo = new THREE.TubeGeometry(railCurve, 36, 0.42, 6, false);
          bedGeo.scale(1, 0.25, 1);
          const bedMesh = new THREE.Mesh(bedGeo, ballastMat);
          bedMesh.position.y = -0.14;
          bedMesh.receiveShadow = true;

          const isFirstSym = edge.symbol === 'a' || edge.symbol === '0';
          const isSecondSym = edge.symbol === 'b' || edge.symbol === '1';
          const chosenRailMat =
            edge.kind === 'dead'
              ? deadRailMat
              : isFirstSym
              ? line1PinkRailMat
              : isSecondSym
              ? line2BlueRailMat
              : trainRailMat;

          const guideGeo = new THREE.TubeGeometry(railCurve, 36, 0.16, 8, false);
          const guideMesh = new THREE.Mesh(guideGeo, chosenRailMat);
          guideMesh.castShadow = !isSoftwareGl;
          guideMesh.receiveShadow = true;
          networkGroup.add(bedMesh, guideMesh);

          // Sample sleepers along the rail curve
          const steps = Math.max(8, Math.floor(railCurve.getLength() / 0.85));
          for (let i = 0; i <= steps; i++) {
            const u = i / steps;
            const pt = railCurve.getPointAt(u);
            railCurve.getTangentAt(u, tangentVec);
            tempObj.position.set(pt.x, 0.08, pt.z);
            tempObj.rotation.set(0, Math.atan2(tangentVec.x, tangentVec.z), 0);
            tempObj.updateMatrix();
            sleeperMatrices.push(tempObj.matrix.clone());
          }

          networkDisposers.push(() => {
            bedGeo.dispose();
            guideGeo.dispose();
          });

          // Minimalist trackside label for symbol (a, b, error)
          const midRailPt = railCurve.getPointAt(0.5);
          const railLbl = buildMinimal3DLabel({
            symbol: edge.symbol,
            caption: edge.caption,
            accentColor:
              edge.kind === 'dead'
                ? '#e11d48'
                : isFirstSym
                ? '#F04E98'
                : isSecondSym
                ? '#005EB8'
                : '#f26522',
            position: new THREE.Vector3(midRailPt.x, 0.12, midRailPt.z + 0.52),
            scale: 0.78,
            withPost: true,
            maxAnisotropy: maxAniso,
          });
          networkGroup.add(railLbl.group);
          networkDisposers.push(railLbl.dispose);
        }
      });

      if (sleeperMatrices.length > 0) {
        const sleepersInst = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperMatrices.length);
        sleeperMatrices.forEach((m, i) => sleepersInst.setMatrixAt(i, m));
        sleepersInst.instanceMatrix.needsUpdate = true;
        sleepersInst.computeBoundingSphere();
        sleepersInst.receiveShadow = true;
        networkGroup.add(sleepersInst);
      }

      // Snap train immediately to initial station of the newly built network
      const initialId =
        mode === 'nfa'
          ? nfaStates[0] ?? activeBundle.spec.startState
          : mode === 'dfa'
          ? dfaState ?? activeBundle.dfaStartId
          : layout.nodes[0]?.id ?? null;
      snapTrainToStation(initialId);
    };

    buildNetwork();
    rebuildNetworkRef.current = buildNetwork;

    triggerCameraFocusRef.current = () => {
      if (!userControlling) {
        scriptedCamActive = true;
      }
    };

    // Raycaster for clicking stations
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointerNdc = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (ev: PointerEvent) => {
      pointerDownPos = { x: ev.clientX, y: ev.clientY };
    };

    const onPointerUp = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - pointerDownPos.x, ev.clientY - pointerDownPos.y);
      if (dist > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(clickableProxies, false);
      if (hits.length > 0) {
        const stId = hits[0].object.userData.stationId as string | undefined;
        if (stId) {
          propsRef.current.onStationClick?.(stId);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsed = clock.getElapsedTime();

      const {
        networkMode: mode,
        bundle: activeBundle,
        activeNfaStates: nfaStates,
        activeDfaState: dfaState,
        focusStationId: focusId,
        isTitleScreen: titleMode,
      } = propsRef.current;

      // 1. Resolve Primary Station Target & Initiate Curve-Following Motion
      let primaryId: string | null = null;
      if (mode === 'nfa') {
        primaryId = nfaStates[0] ?? activeBundle.spec.startState;
      } else if (mode === 'dfa') {
        primaryId = dfaState ?? activeBundle.dfaStartId;
      } else {
        const firstKey = stationCoordsMap.keys().next().value as string | undefined;
        primaryId = firstKey ?? null;
      }

      const showTrain = mode !== 'nfa' || nfaStates.length > 0;
      trainAsset.setVisible(showTrain);

      if (primaryId && primaryId !== targetStationId) {
        const fromId = currentStationId ?? primaryId;
        const pFrom = stationCoordsMap.get(fromId);
        const pTo = stationCoordsMap.get(primaryId);

        if (pFrom && pTo) {
          if (fromId === primaryId) {
            snapTrainToStation(primaryId);
          } else {
            const directCurve = edgeCurvesMap.get(`${fromId}->${primaryId}`);
            if (directCurve && directCurve.getPointAt(0).y < 1.0) {
              activeTrainCurve = directCurve;
              isTempCurve = false;
            } else {
              // Smooth rail transfer curve when jumping over ε or non-adjacent click
              const mx = (pFrom.x + pTo.x) / 2;
              const mz = (pFrom.z + pTo.z) / 2 + TRAIN_RAIL_Z_OFFSET + 1.4;
              activeTrainCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(pFrom.x, TRAIN_RAIL_Y, pFrom.z + TRAIN_RAIL_Z_OFFSET),
                new THREE.Vector3(mx, TRAIN_RAIL_Y, mz),
                new THREE.Vector3(pTo.x, TRAIN_RAIL_Y, pTo.z + TRAIN_RAIL_Z_OFFSET),
              ]);
              isTempCurve = true;
            }
            targetStationId = primaryId;
            curveProgress = 0;
            isTrainMoving = true;
          }
        }
      }

      // 2. Advance Articulated 2-Car Train Along Active Rail Curve
      if (isTrainMoving && activeTrainCurve) {
        // Close doors before accelerating
        doorOpenProgress = THREE.MathUtils.damp(doorOpenProgress, 0, 14, dt);
        const curveLen = Math.max(4, activeTrainCurve.getLength());
        const travelDuration = THREE.MathUtils.clamp(curveLen / 9.5, 0.75, 1.55);
        curveProgress = Math.min(1, curveProgress + dt / travelDuration);

        // Smoothstep velocity curve (gentle acceleration & station braking)
        const easedU = curveProgress * curveProgress * (3 - 2 * curveProgress);
        const carGapU = Math.min(0.45, 2.75 / curveLen);
        const trailerU = Math.max(0, easedU - carGapU);

        activeTrainCurve.getPointAt(easedU, _leadPos);
        activeTrainCurve.getTangentAt(easedU, _leadTangent);

        activeTrainCurve.getPointAt(trailerU, _trailerPos);
        activeTrainCurve.getTangentAt(trailerU, _trailerTangent);

        trainAsset.leadGroup.position.copy(_leadPos);
        _lookTarget.copy(_leadPos).add(_leadTangent);
        trainAsset.leadGroup.lookAt(_lookTarget);

        // Subtle Metro pneumatic suspension pitch (nose up on launch, nose down on brake)
        const accelPitch = Math.sin(curveProgress * Math.PI * 2) * 0.025;
        trainAsset.leadGroup.rotateX(-accelPitch);

        trainAsset.trailerGroup.position.copy(_trailerPos);
        _lookTarget.copy(_trailerPos).add(_trailerTangent);
        trainAsset.trailerGroup.lookAt(_lookTarget);
        trainAsset.trailerGroup.rotateX(-accelPitch * 0.7);

        // Position articulated accordion bellows between lead rear and trailer front
        _bellowsPos.copy(_leadPos).lerp(_trailerPos, 0.5);
        _bellowsPos.y += 0.72;
        trainAsset.bellowsMesh.position.copy(_bellowsPos);
        _lookTarget.copy(_leadPos);
        _lookTarget.y = _bellowsPos.y;
        trainAsset.bellowsMesh.lookAt(_lookTarget);

        if (curveProgress >= 1) {
          isTrainMoving = false;
          currentStationId = targetStationId;
          parkForwardDir.copy(_leadTangent).normalize();
          if (isTempCurve) {
            activeTrainCurve = null;
            isTempCurve = false;
          }
        }
      } else {
        // Parked smoothly at platform: open sliding doors & keep gentle pneumatic idle
        doorOpenProgress = THREE.MathUtils.damp(doorOpenProgress, 1, 7, dt);
        const targetPos = targetStationId ? stationCoordsMap.get(targetStationId) : undefined;
        if (targetPos) {
          const anchorX = targetPos.x + parkForwardDir.x * 1.15;
          const anchorZ = targetPos.z + TRAIN_RAIL_Z_OFFSET + parkForwardDir.z * 1.15;
          trainAsset.leadGroup.position.x = THREE.MathUtils.damp(trainAsset.leadGroup.position.x, anchorX, 6, dt);
          trainAsset.leadGroup.position.z = THREE.MathUtils.damp(trainAsset.leadGroup.position.z, anchorZ, 6, dt);
          trainAsset.leadGroup.position.y = TRAIN_RAIL_Y + Math.sin(elapsed * 2.2) * 0.008;

          const trailerX = trainAsset.leadGroup.position.x - parkForwardDir.x * 2.7;
          const trailerZ = trainAsset.leadGroup.position.z - parkForwardDir.z * 2.7;
          trainAsset.trailerGroup.position.set(trailerX, trainAsset.leadGroup.position.y, trailerZ);

          _lookTarget.copy(trainAsset.leadGroup.position).add(parkForwardDir);
          trainAsset.leadGroup.lookAt(_lookTarget);
          trainAsset.trailerGroup.lookAt(trainAsset.leadGroup.position);

          _bellowsPos.copy(trainAsset.leadGroup.position).lerp(trainAsset.trailerGroup.position, 0.5);
          _bellowsPos.y += 0.72;
          trainAsset.bellowsMesh.position.copy(_bellowsPos);
          _lookTarget.copy(trainAsset.leadGroup.position);
          _lookTarget.y = _bellowsPos.y;
          trainAsset.bellowsMesh.lookAt(_lookTarget);
        }
      }

      // Animate sliding Metro doors on both cars
      const doorAmount = THREE.MathUtils.clamp(doorOpenProgress, 0, 1);
      for (let i = 0; i < trainAsset.leadDoors.length; i++) {
        const dPair = trainAsset.leadDoors[i];
        dPair.mesh.position.z = dPair.closedZ + dPair.openOffsetZ * doorAmount;
      }
      for (let i = 0; i < trainAsset.trailerDoors.length; i++) {
        const dPair = trainAsset.trailerDoors[i];
        dPair.mesh.position.z = dPair.closedZ + dPair.openOffsetZ * doorAmount;
      }

      // 3. Animate Flowing Directional Light Beads on ε Skybridges
      for (let bIdx = 0; bIdx < animatedWalkBridges.length; bIdx++) {
        const bridge = animatedWalkBridges[bIdx];
        for (let k = 0; k < bridge.beads.length; k++) {
          const u = ((elapsed * 0.38 + k / bridge.beads.length + bIdx * 0.17) % 1 + 1) % 1;
          bridge.curve.getPointAt(u, _beadPos);
          bridge.beads[k].position.copy(_beadPos);
        }
      }

      // 4. Ghost Clones when in NFA mode and multiple stations active (e.g. {C, D, F})
      ghostTokens.forEach((tok, idx) => {
        if (mode === 'nfa' && nfaStates.length > 1 && idx < nfaStates.length) {
          const stPos = stationCoordsMap.get(nfaStates[idx]);
          if (stPos) {
            tok.group.visible = true;
            tok.group.position.x = THREE.MathUtils.damp(tok.group.position.x, stPos.x, 7, dt);
            tok.group.position.z = THREE.MathUtils.damp(tok.group.position.z, stPos.z + 0.75, 7, dt);
            tok.group.position.y = 0.38 + Math.sin(elapsed * 3.2 + idx) * 0.09;
            tok.group.rotation.y = elapsed * 1.4 + idx;
            return;
          }
        }
        tok.group.visible = false;
      });

      // 5. Highlight active station beacon rings
      activeBeaconMeshes.forEach((ring, id) => {
        const isHot =
          (mode === 'nfa' && nfaStates.includes(id)) ||
          (mode === 'dfa' && dfaState === id) ||
          focusId === id;
        const mat = ring.material as THREE.MeshBasicMaterial;
        const targetOp = isHot ? 0.94 : 0.25;
        mat.opacity = THREE.MathUtils.damp(mat.opacity, targetOp, 8, dt);
        const targetScale = isHot ? 1.12 + Math.sin(elapsed * 4) * 0.04 : 1.0;
        ring.scale.setScalar(THREE.MathUtils.damp(ring.scale.x, targetScale, 8, dt));
      });

      // 6. Smooth Camera Choreography
      if (titleMode) {
        const orbitAngle = elapsed * 0.13;
        _camGoalPos.set(Math.sin(orbitAngle) * 25, 13.8, Math.cos(orbitAngle) * 25);
        _camGoalTarget.set(0, 1.4, 0);
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoalPos.x, 3, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoalPos.y, 3, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoalPos.z, 3, dt);
        controls.target.lerp(_camGoalTarget, 1 - Math.exp(-3 * dt));
      } else if (scriptedCamActive) {
        const targetId = focusId || primaryId;
        const focusVec = targetId ? stationCoordsMap.get(targetId) : undefined;
        if (mode === 'dfa') {
          _camGoalTarget.set(focusVec ? focusVec.x * 0.35 : 0, 1.1, focusVec ? focusVec.z * 0.35 : 0);
          _camGoalPos.set(_camGoalTarget.x, 17.5, _camGoalTarget.z + 21);
        } else {
          _camGoalTarget.set(focusVec ? focusVec.x * 0.45 : 0, 1.3, 0);
          _camGoalPos.set(_camGoalTarget.x, 13.8, 22.5);
        }
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoalPos.x, 4.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoalPos.y, 4.5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoalPos.z, 4.5, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _camGoalTarget.x, 5, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _camGoalTarget.y, 5, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _camGoalTarget.z, 5, dt);

        if (camera.position.distanceTo(_camGoalPos) < 0.15) {
          scriptedCamActive = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      controls.dispose();
      clearNetwork();
      trainAsset.dispose();
      landmarks.dispose();
      ghostTokens.forEach((t) => t.dispose());
      groundGeo.dispose();
      groundMat.dispose();
      plazaTex.dispose();
      shadowTex.dispose();
      trunkGeo.dispose();
      trunkMat.dispose();
      crownGeo.dispose();
      crownMat.dispose();
      poleGeo.dispose();
      poleMat.dispose();
      bulbGeo.dispose();
      bulbMat.dispose();
      envTex.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-slate-100">
      <div ref={mountRef} className="w-full h-full" />
      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-white text-sm p-6 text-center">
          Contexto gráfico 3D pausado temporalmente. Recarga la página para restaurar la vista del Metro.
        </div>
      )}
    </div>
  );
};
