import * as THREE from 'three';
import { CDMX_LINES, getStationVisualSpec } from '../data/cdmxLinesData';
import {
  createMetroTotemTexture,
  createMiniLabelTexture,
  createStationSignTexture,
  createTrainDestinationTexture,
} from './proceduralTextures';

export interface StationBuildOptions {
  id: string;
  label: string;
  x: number;
  z: number;
  variant: 'normal' | 'accept' | 'deadend' | 'start';
  maxAnisotropy: number;
  shadowTexture: THREE.Texture;
}

export interface SlidingDoorPair {
  mesh: THREE.Mesh;
  closedZ: number;
  openOffsetZ: number;
}

export interface ArticulatedMetroTrain {
  leadGroup: THREE.Group;
  trailerGroup: THREE.Group;
  bellowsMesh: THREE.Mesh;
  leadDoors: SlidingDoorPair[];
  trailerDoors: SlidingDoorPair[];
  setVisible: (visible: boolean) => void;
  dispose: () => void;
}

/**
 * Builds an articulated 2-car STC Metro CDMX train inspired by the classic
 * orange NM-73 / NE-92 / NM-16 pneumatic-tire rolling stock.
 * Local forward direction is +Z; y = 0 sits flush on the track bed.
 */
export function buildMetroTrain(
  shadowTexture: THREE.Texture,
  maxAnisotropy: number
): ArticulatedMetroTrain {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // Authentic STC Metro CDMX Orange (#F26522) & material hierarchy
  const orangeBodyMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf26522, roughness: 0.32, metalness: 0.16 })
  );
  const darkCabMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.45, metalness: 0.35 })
  );
  const darkSteelMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72, metalness: 0.45 })
  );
  const brushedAlumMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.24, metalness: 0.85 })
  );
  const glassMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.08, metalness: 0.3 })
  );
  const doorPanelMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.26, metalness: 0.35 })
  );
  const rubberTireMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.88, metalness: 0.05 })
  );
  const wheelHubMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.22, metalness: 0.9 })
  );
  const emblemWhiteMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 })
  );
  const headlightMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 1.9,
      roughness: 0.2,
    })
  );
  const tailLightMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      emissive: 0xe11d48,
      emissiveIntensity: 1.3,
      roughness: 0.25,
    })
  );

  const destTex = createTrainDestinationTexture(maxAnisotropy);
  textures.push(destTex);
  const destLedMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: destTex,
      emissiveMap: destTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.85,
      roughness: 0.25,
    })
  );

  // Shared cross-section shape for Metro CDMX car shell
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-0.56, 0.26);
  bodyShape.lineTo(0.56, 0.26);
  bodyShape.lineTo(0.58, 1.04);
  bodyShape.quadraticCurveTo(0.56, 1.34, 0.34, 1.38);
  bodyShape.lineTo(-0.34, 1.38);
  bodyShape.quadraticCurveTo(-0.56, 1.34, -0.58, 1.04);
  bodyShape.closePath();

  const carBodyGeo = trackGeo(
    new THREE.ExtrudeGeometry(bodyShape, {
      depth: 2.32,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.04,
      bevelSegments: 3,
    })
  );
  carBodyGeo.translate(0, 0, -1.16);

  const skirtGeo = trackGeo(new THREE.BoxGeometry(1.04, 0.18, 2.34));
  const roofFairingGeo = trackGeo(new THREE.BoxGeometry(0.84, 0.08, 2.12));
  const hvacPodGeo = trackGeo(new THREE.BoxGeometry(0.62, 0.1, 0.52));
  const stripeGeo = trackGeo(new THREE.BoxGeometry(1.25, 0.07, 2.38));
  const sideWinGeo = trackGeo(new THREE.BoxGeometry(1.25, 0.3, 0.36));
  const doorGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.76, 0.22));
  const doorGlassGeo = trackGeo(new THREE.BoxGeometry(0.07, 0.32, 0.14));
  const tireGeo = trackGeo(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 16));
  tireGeo.rotateZ(Math.PI / 2);
  const hubGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 12));
  hubGeo.rotateZ(Math.PI / 2);
  const axleGeo = trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.96, 8));
  axleGeo.rotateZ(Math.PI / 2);

  const shadowGeo = trackGeo(new THREE.PlaneGeometry(2.05, 3.1));
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.52,
    })
  );

  const populateCommonCarParts = (
    carGroup: THREE.Group,
    doorsOut: SlidingDoorPair[]
  ) => {
    const body = new THREE.Mesh(carBodyGeo, orangeBodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    carGroup.add(body);

    const skirt = new THREE.Mesh(skirtGeo, darkSteelMat);
    skirt.position.set(0, 0.18, 0);
    skirt.castShadow = true;
    carGroup.add(skirt);

    const roof = new THREE.Mesh(roofFairingGeo, brushedAlumMat);
    roof.position.set(0, 1.44, 0);
    roof.castShadow = true;
    carGroup.add(roof);

    [-0.52, 0.52].forEach((zPos) => {
      const pod = new THREE.Mesh(hvacPodGeo, brushedAlumMat);
      pod.position.set(0, 1.5, zPos);
      pod.castShadow = true;
      carGroup.add(pod);
    });

    // Brushed aluminum beltline trim
    const stripe = new THREE.Mesh(stripeGeo, brushedAlumMat);
    stripe.position.set(0, 0.56, 0);
    carGroup.add(stripe);

    // Side passenger windows (3 bays per car)
    [-0.78, 0, 0.78].forEach((zPos) => {
      const win = new THREE.Mesh(sideWinGeo, glassMat);
      win.position.set(0, 0.96, zPos);
      carGroup.add(win);
    });

    // Animated sliding door pairs on left (-X) and right (+X) sides
    [-0.4, 0.4].forEach((doorCenterZ) => {
      [-0.6, 0.6].forEach((xSide) => {
        [-0.11, 0.11].forEach((leafOffset) => {
          const doorGroup = new THREE.Mesh(doorGeo, doorPanelMat);
          const closedZ = doorCenterZ + leafOffset;
          doorGroup.position.set(xSide, 0.72, closedZ);
          const doorGlass = new THREE.Mesh(doorGlassGeo, glassMat);
          doorGlass.position.set(0, 0.16, 0);
          doorGroup.add(doorGlass);
          carGroup.add(doorGroup);

          doorsOut.push({
            mesh: doorGroup,
            closedZ,
            openOffsetZ: leafOffset < 0 ? -0.18 : 0.18,
          });
        });
      });
    });

    // Pneumatic rubber tires (iconic Metro CDMX bogies)
    [-0.86, -0.54, 0.54, 0.86].forEach((zPos) => {
      const axle = new THREE.Mesh(axleGeo, darkSteelMat);
      axle.position.set(0, 0.15, zPos);
      carGroup.add(axle);

      [-0.48, 0.48].forEach((xSide) => {
        const tire = new THREE.Mesh(tireGeo, rubberTireMat);
        tire.position.set(xSide, 0.15, zPos);
        carGroup.add(tire);

        const hub = new THREE.Mesh(hubGeo, wheelHubMat);
        hub.position.set(xSide, 0.15, zPos);
        carGroup.add(hub);
      });
    });

    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.02;
    carGroup.add(shadow);
  };

  // --- 1. LEAD CAB CAR ---
  const leadGroup = new THREE.Group();
  const leadDoors: SlidingDoorPair[] = [];
  populateCommonCarParts(leadGroup, leadDoors);

  // Dark Metro CDMX cab mask (+Z front)
  const cabMaskGeo = trackGeo(new THREE.BoxGeometry(1.08, 0.82, 0.1));
  const cabMask = new THREE.Mesh(cabMaskGeo, darkCabMat);
  cabMask.position.set(0, 0.86, 1.2);
  leadGroup.add(cabMask);

  // Divided front cab windshields
  const cabWindGeo = trackGeo(new THREE.BoxGeometry(0.42, 0.36, 0.05));
  [-0.25, 0.25].forEach((xOff) => {
    const win = new THREE.Mesh(cabWindGeo, glassMat);
    win.position.set(xOff, 0.96, 1.24);
    leadGroup.add(win);
  });

  // Illuminated LED destination board ("L1 PANTITLÁN")
  const ledGeo = trackGeo(new THREE.BoxGeometry(0.76, 0.17, 0.05));
  const ledBoard = new THREE.Mesh(ledGeo, destLedMat);
  ledBoard.position.set(0, 1.24, 1.23);
  leadGroup.add(ledBoard);

  // Iconic 3-bar STC 'M' emblem on front nose
  const barGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.18, 0.04));
  [-0.08, 0, 0.08].forEach((xOff) => {
    const bar = new THREE.Mesh(barGeo, emblemWhiteMat);
    bar.position.set(xOff, 0.52, 1.24);
    leadGroup.add(bar);
  });

  // Front headlights & anti-climber bumper
  const bumperGeo = trackGeo(new THREE.BoxGeometry(1.06, 0.1, 0.14));
  const bumper = new THREE.Mesh(bumperGeo, darkSteelMat);
  bumper.position.set(0, 0.32, 1.22);
  leadGroup.add(bumper);

  const lampGeo = trackGeo(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12));
  lampGeo.rotateX(Math.PI / 2);
  [-0.36, 0.36].forEach((xOff) => {
    const hl = new THREE.Mesh(lampGeo, headlightMat);
    hl.position.set(xOff, 0.48, 1.24);
    leadGroup.add(hl);
  });

  // --- 2. TRAILER CAR ---
  const trailerGroup = new THREE.Group();
  const trailerDoors: SlidingDoorPair[] = [];
  populateCommonCarParts(trailerGroup, trailerDoors);

  // Rear cab mask & tail lights (-Z rear)
  const rearMask = new THREE.Mesh(cabMaskGeo, darkCabMat);
  rearMask.position.set(0, 0.86, -1.2);
  trailerGroup.add(rearMask);

  [-0.25, 0.25].forEach((xOff) => {
    const win = new THREE.Mesh(cabWindGeo, glassMat);
    win.position.set(xOff, 0.96, -1.24);
    trailerGroup.add(win);
  });

  const rearLed = new THREE.Mesh(ledGeo, destLedMat);
  rearLed.position.set(0, 1.24, -1.23);
  rearLed.rotation.y = Math.PI;
  trailerGroup.add(rearLed);

  [-0.36, 0.36].forEach((xOff) => {
    const tl = new THREE.Mesh(lampGeo, tailLightMat);
    tl.position.set(xOff, 0.48, -1.24);
    trailerGroup.add(tl);
  });

  // --- 3. ARTICULATED ACCORDION BELLOWS ---
  const bellowsGeo = trackGeo(new THREE.BoxGeometry(0.82, 0.94, 0.65));
  const bellowsMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.85, metalness: 0.15 })
  );
  const bellowsMesh = new THREE.Mesh(bellowsGeo, bellowsMat);
  bellowsMesh.castShadow = true;

  return {
    leadGroup,
    trailerGroup,
    bellowsMesh,
    leadDoors,
    trailerDoors,
    setVisible: (visible: boolean) => {
      leadGroup.visible = visible;
      trailerGroup.visible = visible;
      bellowsMesh.visible = visible;
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}

/**
 * Authentic CDMX Metro Station Platform:
 * Candela-inspired vaulted concrete canopy, STC #F26522 structural ribs & turnstiles,
 * yellow tactile safety strip, tubular platform railings, concrete bench, and Lance Wyman pylon.
 */
export function buildMetroStation(opts: StationBuildOptions): {
  group: THREE.Group;
  beaconRing: THREE.Mesh;
  proxyCollider: THREE.Mesh;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.position.set(opts.x, 0, opts.z);

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const spec = getStationVisualSpec(opts.id);
  const lineColorsHex =
    spec.lines.length > 0
      ? spec.lines.map((l) => new THREE.Color(CDMX_LINES[l].color))
      : [new THREE.Color(opts.variant === 'deadend' ? 0xe11d48 : 0xf26522)];

  const lineMats = lineColorsHex.map((col) =>
    trackMat(new THREE.MeshStandardMaterial({ color: col, roughness: 0.36, metalness: 0.22 }))
  );

  const concreteMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.88, metalness: 0.04 })
  );
  const darkConcreteMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, metalness: 0.05 })
  );
  const safetyYellowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.55,
      metalness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  const steelMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.28, metalness: 0.82 })
  );
  const chromeMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.18, metalness: 0.92 })
  );
  const canopyMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: opts.variant === 'accept' ? 0xd1fae5 : opts.variant === 'deadend' ? 0xffe4e6 : 0xf1f5f9,
      roughness: 0.58,
      metalness: 0.12,
    })
  );

  // 1. Concrete platform base + plinth trim
  const baseGeo = trackGeo(new THREE.BoxGeometry(3.8, 0.36, 3.0));
  const baseMesh = new THREE.Mesh(baseGeo, concreteMat);
  baseMesh.position.y = 0.18;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Platform edge dark apron
  const apronGeo = trackGeo(new THREE.BoxGeometry(3.84, 0.14, 0.08));
  const apron = new THREE.Mesh(apronGeo, darkConcreteMat);
  apron.position.set(0, 0.29, 1.5);
  group.add(apron);

  // 2. Yellow tactile safety strip along boarding edge (+Z)
  const stripGeo = trackGeo(new THREE.BoxGeometry(3.74, 0.03, 0.24));
  const frontStrip = new THREE.Mesh(stripGeo, safetyYellowMat);
  frontStrip.position.set(0, 0.375, 1.32);
  group.add(frontStrip);

  const backStrip = new THREE.Mesh(stripGeo, safetyYellowMat);
  backStrip.position.set(0, 0.375, -1.32);
  group.add(backStrip);

  // 3. Candela-style V-ribbed canopy support columns colored with station's original Metro lines
  const colGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.11, 2.25, 12));
  [-1.25, 1.25].forEach((xOff, idx) => {
    const col = new THREE.Mesh(colGeo, lineMats[idx % lineMats.length]);
    col.position.set(xOff, 1.48, -0.78);
    col.castShadow = true;
    group.add(col);
  });

  // Diagonal cantilevered ribs supporting umbrella vault
  const ribGeo = trackGeo(new THREE.BoxGeometry(0.1, 0.1, 1.55));
  [-1.25, 0, 1.25].forEach((xOff, idx) => {
    const rib = new THREE.Mesh(ribGeo, lineMats[idx % lineMats.length]);
    rib.position.set(xOff, 2.55, -0.35);
    rib.rotation.x = -0.14;
    group.add(rib);
  });

  // 4. Dual-pitched Candela concrete umbrella canopy + Multi-line color fascia strip
  const wingGeo = trackGeo(new THREE.BoxGeometry(3.85, 0.1, 1.05));
  const frontWing = new THREE.Mesh(wingGeo, canopyMat);
  frontWing.position.set(0, 2.7, 0.1);
  frontWing.rotation.x = -0.16;
  frontWing.castShadow = true;
  group.add(frontWing);

  const backWing = new THREE.Mesh(wingGeo, canopyMat);
  backWing.position.set(0, 2.66, -0.82);
  backWing.rotation.x = 0.16;
  backWing.castShadow = true;
  group.add(backWing);

  const segW = 3.85 / lineMats.length;
  const fasciaGeo = trackGeo(new THREE.BoxGeometry(segW, 0.12, 0.08));
  lineMats.forEach((mat, idx) => {
    const fascia = new THREE.Mesh(fasciaGeo, mat);
    fascia.position.set(-1.925 + segW * (idx + 0.5), 2.79, 0.62);
    group.add(fascia);
  });

  // 5. STC Metro CDMX Turnstiles ("Torniquetes") in official line colors
  const turnstileBodyGeo = trackGeo(new THREE.BoxGeometry(0.18, 0.68, 0.44));
  const tripodGeo = trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 8));
  [-1.1, -0.55, 0].forEach((xOff, idx) => {
    const body = new THREE.Mesh(turnstileBodyGeo, lineMats[idx % lineMats.length]);
    body.position.set(xOff, 0.7, 0.45);
    body.castShadow = true;
    group.add(body);

    if (xOff < 0) {
      const arm = new THREE.Mesh(tripodGeo, chromeMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(xOff + 0.25, 0.78, 0.45);
      group.add(arm);
    }
  });

  // Minimalist micro-label above turnstiles ("Torniquetes")
  const turnLabelTex = createMiniLabelTexture(
    opts.variant === 'accept' ? 'EF=1' : 'T',
    opts.variant === 'accept' ? 'Salida válida' : 'Torniquetes',
    opts.variant === 'accept' ? '#10b981' : spec.primaryColor,
    opts.maxAnisotropy
  );
  textures.push(turnLabelTex);
  const turnSpriteMat = trackMat(
    new THREE.SpriteMaterial({ map: turnLabelTex, transparent: true, depthTest: true })
  );
  const turnSprite = new THREE.Sprite(turnSpriteMat);
  turnSprite.position.set(-0.55, 1.38, 0.45);
  turnSprite.scale.set(1.35, 0.34, 1);
  group.add(turnSprite);

  // 6. Concrete Metro bench & tubular end railing in line colors
  const benchGeo = trackGeo(new THREE.BoxGeometry(1.1, 0.28, 0.42));
  const bench = new THREE.Mesh(benchGeo, darkConcreteMat);
  bench.position.set(1.0, 0.5, -0.35);
  bench.castShadow = true;
  group.add(bench);

  const railPostGeo = trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 8));
  const railBarGeo = trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 8));
  railBarGeo.rotateX(Math.PI / 2);
  [-1.78, 1.78].forEach((xEnd, idx) => {
    [-0.95, 0.55].forEach((zPost) => {
      const post = new THREE.Mesh(railPostGeo, steelMat);
      post.position.set(xEnd, 0.72, zPost);
      group.add(post);
    });
    const topBar = new THREE.Mesh(railBarGeo, lineMats[idx % lineMats.length]);
    topBar.position.set(xEnd, 1.05, -0.2);
    group.add(topBar);
  });

  // 7. Official Lance Wyman STC Metro Signage Pylon
  const signTex = createStationSignTexture(opts.id, opts.label, opts.variant, opts.maxAnisotropy);
  textures.push(signTex);
  const signFaceMat = trackMat(
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.32, metalness: 0.08 })
  );
  const signBoardGeo = trackGeo(new THREE.BoxGeometry(3.25, 1.58, 0.16));
  const signBoard = new THREE.Mesh(signBoardGeo, [
    steelMat,
    steelMat,
    steelMat,
    steelMat,
    signFaceMat,
    signFaceMat,
  ]);
  signBoard.position.set(0, 3.62, -0.36);
  signBoard.castShadow = true;
  group.add(signBoard);

  const bracketGeo = trackGeo(new THREE.BoxGeometry(0.16, 0.48, 0.16));
  const bracket = new THREE.Mesh(bracketGeo, steelMat);
  bracket.position.set(0, 2.86, -0.36);
  group.add(bracket);

  // 7b. Official Vertical STC Metro Totem ("Tótem oficial" at station entrance)
  const totemTex = createMetroTotemTexture(opts.id, opts.maxAnisotropy);
  textures.push(totemTex);
  const totemFaceMat = trackMat(
    new THREE.MeshStandardMaterial({ map: totemTex, roughness: 0.35, metalness: 0.15 })
  );
  const totemGeo = trackGeo(new THREE.BoxGeometry(0.54, 1.75, 0.24));
  const totemMesh = new THREE.Mesh(totemGeo, [
    steelMat,
    steelMat,
    steelMat,
    steelMat,
    totemFaceMat,
    totemFaceMat,
  ]);
  totemMesh.position.set(-2.18, 0.9, -0.95);
  totemMesh.castShadow = true;
  group.add(totemMesh);

  // 8. Active / Accepting floor halo beacon (colored by station line or accept/deadend status)
  const beaconColor =
    opts.variant === 'accept'
      ? 0x10b981
      : opts.variant === 'deadend'
      ? 0xf43f5e
      : lineColorsHex[0].getHex();
  const beaconGeo = trackGeo(new THREE.RingGeometry(2.15, 2.48, 36));
  beaconGeo.rotateX(-Math.PI / 2);
  const beaconMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: beaconColor,
      transparent: true,
      opacity: opts.variant === 'normal' || opts.variant === 'start' ? 0.32 : 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  const beaconRing = new THREE.Mesh(beaconGeo, beaconMat);
  beaconRing.position.y = 0.04;
  group.add(beaconRing);

  // 9. Soft radial contact shadow
  const shadowGeo = trackGeo(new THREE.PlaneGeometry(5.2, 4.6));
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: opts.shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.44,
    })
  );
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.position.y = 0.015;
  group.add(shadow);

  // Invisible raycast proxy collider on layer 1
  const proxyGeo = trackGeo(new THREE.BoxGeometry(4.2, 4.4, 3.8));
  const proxyMat = trackMat(new THREE.MeshBasicMaterial({ visible: false }));
  const proxyCollider = new THREE.Mesh(proxyGeo, proxyMat);
  proxyCollider.position.y = 2.1;
  proxyCollider.layers.set(1);
  proxyCollider.userData.stationId = opts.id;
  group.add(proxyCollider);

  return {
    group,
    beaconRing,
    proxyCollider,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}

/**
 * Reusable minimalist 3D label sprite (with optional slender post) for tracks,
 * ε skybridges, landmarks, and symbol callouts.
 */
export function buildMinimal3DLabel(opts: {
  symbol: string;
  caption: string;
  accentColor: string;
  position: THREE.Vector3;
  scale?: number;
  withPost?: boolean;
  maxAnisotropy: number;
}): {
  group: THREE.Group;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.position.copy(opts.position);

  const tex = createMiniLabelTexture(opts.symbol, opts.caption, opts.accentColor, opts.maxAnisotropy);
  const spriteMat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: true,
  });
  const sprite = new THREE.Sprite(spriteMat);
  const s = opts.scale ?? 1.0;
  sprite.scale.set(2.25 * s, 0.56 * s, 1);
  sprite.position.y = opts.withPost ? 0.95 : 0;
  group.add(sprite);

  let postGeo: THREE.BufferGeometry | null = null;
  let postMat: THREE.Material | null = null;
  if (opts.withPost) {
    postGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.72, 8);
    postMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.7 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 0.36;
    group.add(post);
  }

  return {
    group,
    dispose: () => {
      tex.dispose();
      spriteMat.dispose();
      postGeo?.dispose();
      postMat?.dispose();
    },
  };
}

/**
 * Iconic Mexico City (CDMX) architectural skyline landmarks grounded at y = 0
 * around the plaza perimeter: Torre Latinoamericana, Monumento a la Revolución,
 * and El Ángel de la Independencia.
 */
export function buildCdmxLandmarks(maxAnisotropy: number): {
  group: THREE.Group;
  dispose: () => void;
} {
  const group = new THREE.Group();
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const childDisposers: (() => void)[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geos.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    mats.push(m);
    return m;
  };

  const stoneMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.85, metalness: 0.05 })
  );
  const glassTowerMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.16, metalness: 0.65 })
  );
  const steelFrameMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.42, metalness: 0.68 })
  );
  const copperDomeMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.45, metalness: 0.4 })
  );
  const spireRedMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.4, metalness: 0.25 })
  );
  const goldAngelMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.22, metalness: 0.92 })
  );

  // --- 1. Torre Latinoamericana (Left Skyline) ---
  const latino = new THREE.Group();
  latino.position.set(-25, 0, -23);
  const tBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.2, 5.5, 4.4)), stoneMat);
  tBase.position.y = 2.75;
  latino.add(tBase);

  const tMid = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.8, 7.2, 3.4)), glassTowerMat);
  tMid.position.y = 9.1;
  latino.add(tMid);

  const tUpper = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.8, 3.6, 2.6)), steelFrameMat);
  tUpper.position.y = 14.5;
  latino.add(tUpper);

  const tDeck = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.2, 0.45, 3.0)), stoneMat);
  tDeck.position.y = 16.4;
  latino.add(tDeck);

  const tSpire = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.35, 5.2, 8)), spireRedMat);
  tSpire.position.y = 19.2;
  latino.add(tSpire);
  group.add(latino);

  // --- 2. Monumento a la Revolución (Right Skyline) ---
  const rev = new THREE.Group();
  rev.position.set(24, 0, -22);
  const pierGeo = trackGeo(new THREE.BoxGeometry(1.5, 6.2, 1.5));
  [
    [-2.0, -2.0],
    [2.0, -2.0],
    [-2.0, 2.0],
    [2.0, 2.0],
  ].forEach(([px, pz]) => {
    const pier = new THREE.Mesh(pierGeo, stoneMat);
    pier.position.set(px, 3.1, pz);
    rev.add(pier);
  });

  const drum = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.8, 2.2, 5.8)), stoneMat);
  drum.position.y = 7.1;
  rev.add(drum);

  const dome = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(2.6, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55)),
    copperDomeMat
  );
  dome.position.y = 8.1;
  rev.add(dome);

  const lantern = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.55, 1.8, 12)), stoneMat);
  lantern.position.y = 11.1;
  rev.add(lantern);
  group.add(rev);

  // --- 3. El Ángel de la Independencia (Center-Back Reforma Axis) ---
  const angel = new THREE.Group();
  angel.position.set(0, 0, -27);
  const plinth1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.4, 1.2, 4.4)), stoneMat);
  plinth1.position.y = 0.6;
  angel.add(plinth1);

  const plinth2 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.8, 2.2, 2.8)), stoneMat);
  plinth2.position.y = 2.3;
  angel.add(plinth2);

  const column = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.58, 0.72, 9.2, 16)), stoneMat);
  column.position.y = 8.0;
  angel.add(column);

  const cap = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.95, 0.62, 0.7, 12)), stoneMat);
  cap.position.y = 12.9;
  angel.add(cap);

  const victoryBody = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.34, 1.6, 10)), goldAngelMat);
  victoryBody.position.y = 14.05;
  angel.add(victoryBody);

  const wingGeo = trackGeo(new THREE.BoxGeometry(1.1, 0.55, 0.1));
  [-0.45, 0.45].forEach((wx) => {
    const wing = new THREE.Mesh(wingGeo, goldAngelMat);
    wing.position.set(wx, 14.35, -0.15);
    wing.rotation.z = wx < 0 ? 0.35 : -0.35;
    angel.add(wing);
  });
  group.add(angel);

  // --- 4. Subtle Paseo de la Reforma Skyline Silhouettes ---
  const skylineSpecs = [
    { x: -13, z: -28, w: 3.4, h: 11.5, d: 3.2 },
    { x: 12, z: -28, w: 3.8, h: 13.0, d: 3.4 },
    { x: -34, z: -12, w: 3.6, h: 9.8, d: 3.6 },
    { x: 34, z: -10, w: 4.0, h: 10.6, d: 3.4 },
  ];
  skylineSpecs.forEach((b, idx) => {
    const tower = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(b.w, b.h, b.d)),
      idx % 2 === 0 ? glassTowerMat : steelFrameMat
    );
    tower.position.set(b.x, b.h / 2, b.z);
    group.add(tower);
  });

  // Minimalist CDMX Landmark Labels
  [
    { symbol: 'CDMX', caption: 'Torre Latino', accent: '#e11d48', pos: new THREE.Vector3(-25, 23.2, -23) },
    { symbol: 'CDMX', caption: 'Mon. Revolución', accent: '#0d9488', pos: new THREE.Vector3(24, 13.5, -22) },
    { symbol: 'CDMX', caption: 'El Ángel', accent: '#f59e0b', pos: new THREE.Vector3(0, 16.5, -27) },
  ].forEach((item) => {
    const lbl = buildMinimal3DLabel({
      symbol: item.symbol,
      caption: item.caption,
      accentColor: item.accent,
      position: item.pos,
      scale: 1.5,
      maxAnisotropy,
    });
    group.add(lbl.group);
    childDisposers.push(lbl.dispose);
  });

  return {
    group,
    dispose: () => {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      childDisposers.forEach((fn) => fn());
    },
  };
}

/**
 * 3-part Glowing Sky-Blue Ghost Passenger Token (for visualizing ε-cloning in 3D!)
 */
export function buildGhostCloneToken(): {
  group: THREE.Group;
  dispose: () => void;
} {
  const group = new THREE.Group();
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    emissive: 0x0284c7,
    emissiveIntensity: 1.15,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
  });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.95,
    roughness: 0.15,
  });
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  mats.push(bodyMat, headMat, haloMat);

  const capsuleGeo = new THREE.CapsuleGeometry(0.24, 0.45, 6, 12);
  const headGeo = new THREE.SphereGeometry(0.2, 14, 14);
  const ringGeo = new THREE.RingGeometry(0.36, 0.48, 24);
  ringGeo.rotateX(-Math.PI / 2);
  geos.push(capsuleGeo, headGeo, ringGeo);

  const body = new THREE.Mesh(capsuleGeo, bodyMat);
  body.position.y = 0.55;
  group.add(body);

  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.12;
  group.add(head);

  const ring = new THREE.Mesh(ringGeo, haloMat);
  ring.position.y = 0.05;
  group.add(ring);

  return {
    group,
    dispose: () => {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
}
