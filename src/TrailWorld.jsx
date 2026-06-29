import { useEffect, useRef } from "react";
import * as THREE from "three";

const stops = [
  { id: "rainforest", label: "Introduction", miles: "0.3 mi", x: -18, z: 16 },
  { id: "rockies", label: "Experience", miles: "1.8 mi", x: -10, z: 5 },
  { id: "arch", label: "Projects", miles: "3.4 mi", x: -1, z: -5 },
  { id: "geyser", label: "Publications", miles: "5.1 mi", x: 9, z: -1 },
  { id: "canyon", label: "Skills", miles: "6.7 mi", x: 17, z: 9 },
  { id: "milky-way", label: "Contact", miles: "8.2 mi", x: 25, z: -8 },
];

const trailPoints = stops.map((stop) => new THREE.Vector3(stop.x, 0.54, stop.z));

function makeRibbonGeometry(curve, segments, baseWidth, options = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const yLift = options.yLift ?? 0;
  const edgeJitter = options.edgeJitter ?? 0.16;
  const widthWave = options.widthWave ?? 0.18;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const noise = Math.sin(t * Math.PI * 8.5) * widthWave + Math.sin(t * Math.PI * 21.7) * edgeJitter;
    const width = baseWidth + noise;
    const leftWidth = width * (0.82 + Math.sin(i * 1.71) * 0.08);
    const rightWidth = width * (0.88 + Math.cos(i * 1.37) * 0.1);
    const left = point.clone().addScaledVector(normal, leftWidth);
    const right = point.clone().addScaledVector(normal, -rightWidth);

    positions.push(left.x, left.y + yLift, left.z, right.x, right.y + yLift, right.z);
    uvs.push(0, t * 8, 1, t * 8);

    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeFallingRibbonGeometry(points, segments, baseWidth) {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.28);
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const side = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
    if (side.lengthSq() < 0.1) side.set(1, 0, 0);
    const width = baseWidth + Math.sin(t * Math.PI * 7) * 0.08 + Math.sin(t * Math.PI * 19) * 0.035;
    const left = point.clone().addScaledVector(side, width);
    const right = point.clone().addScaledVector(side, -width * 0.86);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    uvs.push(0, t * 5, 1, t * 5);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeMat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.82,
    metalness: options.metalness ?? 0.02,
    flatShading: options.flatShading ?? false,
    transparent: options.transparent,
    opacity: options.opacity ?? 1,
  });
}

function cast(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function box(width, height, depth, color, options) {
  return cast(new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), makeMat(color, options)));
}

function sphere(radius, color, width = 24, height = 16, options) {
  return cast(new THREE.Mesh(new THREE.SphereGeometry(radius, width, height), makeMat(color, options)));
}

function cylinder(top, bottom, height, color, radial = 18, options) {
  return cast(new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, radial), makeMat(color, options)));
}

function cone(radius, height, color, radial = 18, options) {
  return cast(new THREE.Mesh(new THREE.ConeGeometry(radius, height, radial), makeMat(color, options)));
}

function makeSignTexture(title, distance) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#1f3326";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#d8b76a";
  ctx.lineWidth = 16;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
  ctx.fillStyle = "#f8f1d8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 46px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText(title, canvas.width / 2, 96);
  ctx.fillStyle = "#efc45f";
  ctx.font = "700 34px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText(distance, canvas.width / 2, 158);
  ctx.fillStyle = "rgba(248, 241, 216, 0.72)";
  ctx.font = "600 22px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText("portfolio trail", canvas.width / 2, 205);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addConifer(group, x, z, scale = 1) {
  const tree = new THREE.Group();
  const trunk = cylinder(0.14 * scale, 0.18 * scale, 1.15 * scale, 0x5b3a28, 10);
  trunk.position.set(0, 0.58 * scale, 0);
  tree.add(trunk);

  [0, 1, 2].forEach((layer) => {
    const foliage = cone((1.02 - layer * 0.2) * scale, 1.55 * scale, layer === 0 ? 0x145834 : 0x1d7443, 18);
    foliage.position.set(0, (1.24 + layer * 0.65) * scale, 0);
    tree.add(foliage);
  });
  tree.position.set(x, 0, z);
  tree.userData.sway = { phase: Math.random() * Math.PI * 2, strength: 0.018 + Math.random() * 0.018 };
  group.add(tree);
}

function addBroadleaf(group, x, z, scale = 1) {
  const tree = new THREE.Group();
  const trunk = cylinder(0.18 * scale, 0.24 * scale, 1.22 * scale, 0x6c442d, 10);
  trunk.position.set(0, 0.62 * scale, 0);
  tree.add(trunk);

  const canopy = sphere(0.95 * scale, 0x2d8f50, 20, 16);
  canopy.scale.set(1.12, 0.82, 1.02);
  canopy.position.set(0, 1.75 * scale, 0);
  tree.add(canopy);

  const crown = sphere(0.55 * scale, 0x51b867, 18, 12);
  crown.scale.set(1.25, 0.78, 1.05);
  crown.position.set(-0.28 * scale, 2.12 * scale, 0.12 * scale);
  tree.add(crown);
  tree.position.set(x, 0, z);
  tree.userData.sway = { phase: Math.random() * Math.PI * 2, strength: 0.026 + Math.random() * 0.02 };
  group.add(tree);
}

function addBirch(group, x, z, scale = 1) {
  const tree = new THREE.Group();
  const trunk = cylinder(0.11 * scale, 0.14 * scale, 1.55 * scale, 0xd7d2bd, 10);
  trunk.position.set(0, 0.78 * scale, 0);
  tree.add(trunk);

  for (let i = 0; i < 3; i += 1) {
    const mark = box(0.16 * scale, 0.035 * scale, 0.018 * scale, 0x27312b);
    mark.position.set(0.11 * scale, (0.48 + i * 0.34) * scale, 0);
    tree.add(mark);
  }

  const canopy = sphere(0.68 * scale, 0x7cae48, 18, 12);
  canopy.scale.set(0.92, 1.05, 0.92);
  canopy.position.set(0, 1.78 * scale, 0);
  tree.add(canopy);
  tree.position.set(x, 0, z);
  tree.userData.sway = { phase: Math.random() * Math.PI * 2, strength: 0.02 + Math.random() * 0.016 };
  group.add(tree);
}

function addRock(group, x, z, scale = 1) {
  const rock = sphere(scale, 0x6f7773, 10, 8, { flatShading: true });
  rock.scale.set(1.35, 0.55, 0.85);
  rock.position.set(x, 0.18 * scale, z);
  rock.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.2);
  group.add(rock);
}

function addGrassPatch(group, x, z, scale = 1) {
  const bladeMat = makeMat(Math.random() > 0.45 ? 0x5ab76d : 0x80a84f, { roughness: 0.94 });
  const count = 8 + Math.floor(Math.random() * 8);
  for (let i = 0; i < count; i += 1) {
    const height = (0.32 + Math.random() * 0.46) * scale;
    const radius = (0.016 + Math.random() * 0.022) * scale;
    const blade = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 5), bladeMat);
    blade.position.set(x + (Math.random() - 0.5) * 0.95 * scale, height * 0.5, z + (Math.random() - 0.5) * 0.95 * scale);
    blade.rotation.z = (Math.random() - 0.5) * 0.45;
    blade.rotation.x = (Math.random() - 0.5) * 0.35;
    blade.castShadow = true;
    blade.userData.grass = {
      phase: Math.random() * Math.PI * 2,
      strength: 0.08 + Math.random() * 0.1,
      baseX: blade.rotation.x,
      baseZ: blade.rotation.z,
    };
    group.add(blade);
  }
}

function addFlowerPatch(group, x, z, scale = 1) {
  const stemMat = makeMat(0x4f9f5e, { roughness: 0.96 });
  const colors = [0xf3d15b, 0xe982a6, 0xb9a7ff, 0xf6f0d6, 0xff9e62];
  const count = 4 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i += 1) {
    const flower = new THREE.Group();
    const height = (0.22 + Math.random() * 0.28) * scale;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012 * scale, 0.015 * scale, height, 5), stemMat);
    stem.position.y = height / 2;
    flower.add(stem);
    const bloomColor = colors[(i + Math.floor(Math.random() * colors.length)) % colors.length];
    for (let p = 0; p < 5; p += 1) {
      const petal = sphere(0.035 * scale, bloomColor, 8, 6, { roughness: 0.7 });
      petal.scale.set(1.3, 0.55, 0.8);
      petal.position.set(Math.cos((p / 5) * Math.PI * 2) * 0.045 * scale, height + 0.02 * scale, Math.sin((p / 5) * Math.PI * 2) * 0.045 * scale);
      flower.add(petal);
    }
    const center = sphere(0.024 * scale, 0x4b321b, 8, 6);
    center.position.y = height + 0.02 * scale;
    flower.add(center);
    flower.position.set(x + (Math.random() - 0.5) * 1.1 * scale, 0, z + (Math.random() - 0.5) * 1.1 * scale);
    flower.userData.grass = {
      phase: Math.random() * Math.PI * 2,
      strength: 0.035 + Math.random() * 0.035,
      baseX: flower.rotation.x,
      baseZ: flower.rotation.z,
    };
    group.add(flower);
  }
}

function addSnowPatch(group, x, z, scale = 1) {
  const snow = sphere(scale, 0xf2f4ea, 18, 10);
  snow.scale.set(1.65, 0.12, 0.92);
  snow.position.set(x, 0.06, z);
  snow.receiveShadow = true;
  group.add(snow);
}

function addWaterSpheres(group, curve, count, options = {}) {
  const color = options.color ?? 0x21b8f0;
  const radius = options.radius ?? 0.16;
  const spread = options.spread ?? 0.34;
  const yLift = options.yLift ?? 0.08;
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0 : i / (count - 1);
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const bead = sphere(radius * (0.78 + Math.random() * 0.5), color, 16, 10, {
      roughness: 0.28,
      metalness: 0.06,
      transparent: true,
      opacity: options.opacity ?? 0.86,
    });
    bead.scale.set(1.35 + Math.random() * 0.45, 0.42 + Math.random() * 0.18, 1.05 + Math.random() * 0.3);
    bead.position.copy(point).addScaledVector(normal, (Math.random() - 0.5) * spread);
    bead.position.y += yLift + Math.sin(t * Math.PI * 8) * 0.025;
    bead.userData.waterBead = { phase: Math.random() * Math.PI * 2, baseY: bead.position.y };
    group.add(bead);
  }
}

function addWater(group) {
  const streamCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-24, 0.28, -7),
    new THREE.Vector3(-15, 0.25, -3),
    new THREE.Vector3(-7, 0.24, -7),
    new THREE.Vector3(3, 0.24, -3),
    new THREE.Vector3(13, 0.24, -7),
    new THREE.Vector3(25, 0.24, -3),
  ]);
  addWaterSpheres(group, streamCurve, 72, { radius: 0.18, spread: 0.78, yLift: 0.12, color: 0x16aee8, opacity: 0.82 });

  const crossingCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.4, 0.35, -8.2),
    new THREE.Vector3(-2.5, 0.36, -6.7),
    new THREE.Vector3(-0.8, 0.37, -5.05),
    new THREE.Vector3(1.1, 0.36, -3.8),
    new THREE.Vector3(3.4, 0.35, -2.75),
  ]);
  const creekBed = new THREE.Mesh(
    makeRibbonGeometry(crossingCurve, 80, 0.96, { yLift: 0.025, edgeJitter: 0.12, widthWave: 0.12 }),
    makeMat(0x4b3b2b, { roughness: 0.98 }),
  );
  creekBed.receiveShadow = true;
  group.add(creekBed);

  addWaterSpheres(group, crossingCurve, 34, { radius: 0.17, spread: 0.52, yLift: 0.12, color: 0x2bc5ff, opacity: 0.86 });

  for (let i = 0; i < 6; i += 1) {
    const t = 0.34 + i * 0.055;
    const point = crossingCurve.getPointAt(t);
    const tangent = crossingCurve.getTangentAt(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const stone = sphere(0.22 + Math.random() * 0.08, 0x7c837e, 12, 8, { flatShading: true });
    stone.scale.set(1.55, 0.22, 0.92);
    stone.position.copy(point).addScaledVector(normal, (i - 2.5) * 0.24);
    stone.position.y = 0.21;
    stone.rotation.set(0.05, Math.random() * Math.PI, 0.02);
    group.add(stone);
  }

  [-1, 1].forEach((side) => {
    for (let i = 0; i < 16; i += 1) {
      const t = i / 15;
      const point = crossingCurve.getPointAt(t);
      const tangent = crossingCurve.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const bankRock = sphere(0.09 + Math.random() * 0.08, 0x696f68, 8, 6, { flatShading: true });
      bankRock.scale.set(1.4, 0.36, 0.82);
      bankRock.position.copy(point).addScaledVector(normal, side * (0.78 + Math.random() * 0.18));
      bankRock.position.y = 0.16;
      group.add(bankRock);
    }
  });

  const mountainRocks = [
    { x: 7.1, y: 1.45, z: -10.65, s: [3.6, 1.45, 2.2], c: 0x4e5954 },
    { x: 5.85, y: 0.95, z: -9.62, s: [2.2, 1.05, 1.45], c: 0x667069 },
    { x: 8.72, y: 0.86, z: -9.58, s: [2.25, 0.96, 1.55], c: 0x5b6761 },
    { x: 7.35, y: 2.62, z: -11.0, s: [2.15, 0.78, 1.28], c: 0x73807a },
  ];
  mountainRocks.forEach((rock) => {
    const mesh = sphere(1, rock.c, 12, 8, { flatShading: true });
    mesh.scale.set(...rock.s);
    mesh.position.set(rock.x, rock.y, rock.z);
    mesh.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.3);
    group.add(mesh);
  });

  const cascadePaths = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(5.7, 2.98, -11.25),
      new THREE.Vector3(7.0, 2.92, -11.45),
      new THREE.Vector3(8.8, 2.72, -11.1),
      new THREE.Vector3(8.15, 2.28, -10.35),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(8.05, 2.24, -10.35),
      new THREE.Vector3(7.25, 1.86, -9.85),
      new THREE.Vector3(6.62, 1.55, -9.24),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(6.55, 1.5, -9.2),
      new THREE.Vector3(7.24, 1.08, -8.42),
      new THREE.Vector3(7.12, 0.58, -7.48),
    ]),
  ];
  cascadePaths.forEach((cascade, index) => {
    addWaterSpheres(group, cascade, 18 - index * 2, { radius: 0.15, spread: 0.34, yLift: 0.12, color: 0x61d7ff, opacity: 0.88 });
  });

  addWaterSpheres(
    group,
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(5.7, 0.36, -7.65),
      new THREE.Vector3(7.25, 0.34, -7.2),
      new THREE.Vector3(9.2, 0.34, -7.8),
    ]),
    24,
    { radius: 0.21, spread: 0.88, yLift: 0.12, color: 0x72dcff, opacity: 0.84 },
  );
}

function addWildlife(group) {
  const elk = new THREE.Group();
  elk.userData.clickAnimal = true;
  const body = sphere(0.62, 0x8a5c3d, 18, 10);
  body.scale.set(1.5, 0.7, 0.72);
  body.position.y = 0.95;
  const chest = sphere(0.36, 0x5a3c28, 14, 8);
  chest.scale.set(0.9, 1.1, 0.85);
  chest.position.set(0.58, 1.0, 0);
  const neck = cylinder(0.16, 0.22, 0.82, 0x765033, 10);
  neck.position.set(0.62, 1.24, 0);
  neck.rotation.z = -0.52;
  const head = sphere(0.27, 0x9b6b45, 14, 10);
  head.scale.set(1.2, 0.8, 0.78);
  head.position.set(0.98, 1.48, 0);
  const muzzle = sphere(0.11, 0x2a211c, 10, 6);
  muzzle.scale.set(1.3, 0.72, 0.8);
  muzzle.position.set(1.24, 1.45, 0);
  elk.add(body, chest, neck, head, muzzle);

  const antlerMat = makeMat(0xd8c18f, { roughness: 0.82 });
  [-1, 1].forEach((side) => {
    const antler = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.028, 0.62, 6), antlerMat);
    beam.position.set(0, 0.28, 0);
    beam.rotation.z = side * 0.38;
    antler.add(beam);
    [0.18, 0.34, 0.48].forEach((height, index) => {
      const tine = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.28 - index * 0.035, 6), antlerMat);
      tine.position.set(side * (0.08 + index * 0.035), height, 0);
      tine.rotation.z = side * 0.86;
      antler.add(tine);
    });
    antler.position.set(1.0, 1.68, side * 0.11);
    antler.rotation.x = side * 0.18;
    elk.add(antler);
  });

  const legs = [];
  [-0.44, -0.16, 0.22, 0.48].forEach((offset, index) => {
    const leg = cylinder(0.045, 0.06, 0.78, 0x5d3d29, 8);
    leg.position.set(offset, 0.38, offset > 0 ? 0.18 : -0.18);
    leg.userData.legPhase = index % 2 === 0 ? 0 : Math.PI;
    legs.push(leg);
    elk.add(leg);
  });
  elk.position.set(13, 0.22, 6.8);
  elk.rotation.y = -0.8;
  elk.scale.setScalar(0.92);
  elk.userData.elk = {
    phase: Math.random(),
    legs,
    curve: new THREE.CatmullRomCurve3([
      new THREE.Vector3(10.5, 0.22, 7.8),
      new THREE.Vector3(13.6, 0.22, 6.3),
      new THREE.Vector3(16.5, 0.22, 7.9),
      new THREE.Vector3(15.0, 0.22, 10.4),
      new THREE.Vector3(11.4, 0.22, 9.6),
    ], true, "catmullrom", 0.2),
  };
  group.add(elk);

  for (let i = 0; i < 5; i += 1) {
    const bird = new THREE.Group();
    bird.userData.clickAnimal = true;
    const bodyPart = sphere(0.08, 0x1d2328, 8, 6);
    const wingL = box(0.26, 0.02, 0.08, 0x1d2328);
    const wingR = wingL.clone();
    wingL.position.x = -0.16;
    wingR.position.x = 0.16;
    wingL.rotation.z = 0.32;
    wingR.rotation.z = -0.32;
    bird.add(bodyPart, wingL, wingR);
    const base = new THREE.Vector3(
      -11 + Math.random() * 9,
      4.8 + Math.random() * 3.4,
      -11 + Math.random() * 7,
    );
    bird.position.copy(base);
    bird.rotation.y = Math.random() * Math.PI * 2;
    bird.userData.bird = {
      phase: Math.random() * Math.PI * 2,
      base,
      driftX: 0.35 + Math.random() * 0.9,
      driftY: 0.12 + Math.random() * 0.35,
      driftZ: 0.25 + Math.random() * 0.8,
    };
    group.add(bird);
  }

  for (let i = 0; i < 4; i += 1) {
    const rabbit = new THREE.Group();
    rabbit.userData.clickAnimal = true;
    const body = sphere(0.18, 0xa89a86, 12, 8);
    body.scale.set(1.45, 0.78, 0.82);
    body.position.y = 0.18;
    const head = sphere(0.11, 0xb5a795, 10, 8);
    head.position.set(0.22, 0.28, 0);
    const earL = cylinder(0.018, 0.026, 0.26, 0xb5a795, 6);
    const earR = earL.clone();
    earL.position.set(0.25, 0.46, -0.045);
    earR.position.set(0.25, 0.46, 0.045);
    earL.rotation.z = -0.18;
    earR.rotation.z = -0.08;
    const tail = sphere(0.055, 0xe6ded0, 8, 6);
    tail.position.set(-0.23, 0.22, 0);
    rabbit.add(body, head, earL, earR, tail);
    rabbit.position.set(-12 + i * 7 + Math.random() * 2, 0.12, 10 + Math.sin(i) * 4);
    rabbit.rotation.y = -0.4 + Math.random() * 0.8;
    rabbit.userData.rabbit = { base: rabbit.position.clone(), phase: Math.random() * Math.PI * 2 };
    group.add(rabbit);
  }

  const fox = new THREE.Group();
  fox.userData.clickAnimal = true;
  const foxBody = sphere(0.28, 0xc66a35, 14, 8);
  foxBody.scale.set(1.8, 0.65, 0.78);
  foxBody.position.y = 0.35;
  const foxHead = sphere(0.17, 0xd3783a, 12, 8);
  foxHead.position.set(0.5, 0.48, 0);
  const foxSnout = cone(0.1, 0.28, 0xf0d2a5, 10);
  foxSnout.rotation.z = -Math.PI / 2;
  foxSnout.position.set(0.69, 0.46, 0);
  const foxTail = cone(0.15, 0.68, 0xc66a35, 12);
  foxTail.rotation.z = Math.PI / 2.6;
  foxTail.position.set(-0.58, 0.42, 0);
  fox.add(foxBody, foxHead, foxSnout, foxTail);
  fox.position.set(-5, 0.16, 12);
  fox.userData.fox = { base: fox.position.clone(), phase: 0 };
  group.add(fox);
}

function createHiker() {
  const group = new THREE.Group();
  const skin = makeMat(0xbf7c58, { roughness: 0.62 });
  const hair = makeMat(0x15110d, { roughness: 0.75 });
  const jacket = makeMat(0x2f6e5d, { roughness: 0.7 });
  const shirt = makeMat(0xd5785a, { roughness: 0.72 });
  const denim = makeMat(0x284f78, { roughness: 0.82 });
  const boot = makeMat(0x2a211b, { roughness: 0.88 });
  const pack = makeMat(0x163f4e, { roughness: 0.82 });

  const hips = sphere(0.34, 0x253c58, 16, 10);
  hips.scale.set(1.05, 0.52, 0.72);
  hips.position.y = 0.96;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.86, 8, 18), shirt);
  torso.position.y = 1.48;
  torso.scale.set(0.92, 1, 0.72);
  cast(torso);

  const jacketPanel = box(0.58, 0.72, 0.08, 0x2f6e5d);
  jacketPanel.position.set(0, 1.53, -0.26);
  const backpack = box(0.62, 0.86, 0.34, 0x163f4e);
  backpack.position.set(0, 1.46, 0.37);

  const neck = cylinder(0.11, 0.13, 0.18, 0xbf7c58, 12);
  neck.position.y = 2.0;
  const head = sphere(0.31, 0xbf7c58, 24, 16);
  head.scale.set(0.86, 1.08, 0.86);
  head.position.y = 2.25;
  const hairCap = sphere(0.32, 0x15110d, 18, 10);
  hairCap.scale.set(0.9, 0.42, 0.86);
  hairCap.position.set(0, 2.42, 0.01);
  const nose = cone(0.055, 0.16, 0xb76f4d, 10);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 2.23, -0.3);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  [-0.09, 0.09].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), eyeMat);
    eye.position.set(x, 2.28, -0.268);
    group.add(eye);
  });

  const hat = cylinder(0.36, 0.42, 0.1, 0xd6aa54, 24);
  hat.position.y = 2.56;
  const brim = cylinder(0.5, 0.5, 0.035, 0xd6aa54, 24);
  brim.position.y = 2.48;

  const armL = cylinder(0.055, 0.07, 0.82, 0xbf7c58, 10);
  const armR = armL.clone();
  armL.position.set(-0.38, 1.43, -0.02);
  armR.position.set(0.38, 1.43, -0.02);
  armL.rotation.z = -0.34;
  armR.rotation.z = 0.42;

  const sleeveL = cylinder(0.075, 0.09, 0.36, 0x2f6e5d, 10);
  const sleeveR = sleeveL.clone();
  sleeveL.position.set(-0.28, 1.75, -0.02);
  sleeveR.position.set(0.28, 1.75, -0.02);
  sleeveL.rotation.z = -0.34;
  sleeveR.rotation.z = 0.42;

  const legL = cylinder(0.075, 0.09, 0.88, 0x284f78, 10);
  const legR = legL.clone();
  legL.position.set(-0.16, 0.48, 0);
  legR.position.set(0.17, 0.49, 0);
  legL.rotation.z = 0.16;
  legR.rotation.z = -0.12;
  const bootL = box(0.24, 0.14, 0.42, 0x2a211b);
  const bootR = bootL.clone();
  bootL.position.set(-0.19, 0.06, -0.1);
  bootR.position.set(0.2, 0.06, -0.08);

  const pole = cylinder(0.018, 0.018, 1.55, 0xe5ddc7, 8);
  pole.position.set(0.58, 0.78, -0.18);
  pole.rotation.z = -0.28;

  [
    hips,
    torso,
    jacketPanel,
    backpack,
    neck,
    head,
    hairCap,
    nose,
    hat,
    brim,
    armL,
    armR,
    sleeveL,
    sleeveR,
    legL,
    legR,
    bootL,
    bootR,
    pole,
  ].forEach((mesh) => group.add(mesh));
  group.scale.setScalar(0.72);
  return group;
}

function addTrailMarkers(group) {
  stops.forEach((stop, index) => {
    const marker = new THREE.Group();
    const postA = cylinder(0.055, 0.07, 1.25, 0x6b492e, 8);
    const postB = cylinder(0.055, 0.07, 1.25, 0x6b492e, 8);
    postA.position.set(-0.46, 0.62, 0);
    postB.position.set(0.46, 0.62, 0);

    const boardMat = new THREE.MeshStandardMaterial({
      map: makeSignTexture(stop.label, stop.miles),
      roughness: 0.72,
      metalness: 0,
    });
    const board = cast(new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.86, 0.09), boardMat));
    board.position.set(0, 1.3, -0.02);

    const cap = box(1.98, 0.08, 0.16, 0x4b3422);
    cap.position.set(0, 1.77, 0);

    const stone = sphere(0.24, index % 2 ? 0x7d827b : 0x5e6964, 12, 8, { flatShading: true });
    stone.scale.set(1.25, 0.48, 0.9);
    stone.position.set(0.72, 0.13, 0.28);

    marker.add(postA, postB, board, cap, stone);

    const point = new THREE.Vector3(stop.x, 0, stop.z);
    const next = trailPoints[Math.min(index + 1, trailPoints.length - 1)];
    const prev = trailPoints[Math.max(index - 1, 0)];
    const tangent = next.clone().sub(prev).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const side = index % 2 === 0 ? 1 : -1;
    marker.position.copy(point).addScaledVector(normal, side * 1.35);
    marker.rotation.y = Math.atan2(tangent.x, tangent.z) + (side > 0 ? -0.38 : Math.PI + 0.38);
    marker.userData.sign = true;
    group.add(marker);
  });
}

export default function TrailWorld({ activeIndex }) {
  const hostRef = useRef(null);
  const progressRef = useRef(0);
  const orbitRef = useRef({ yaw: 0, pitch: 0, dragging: false, x: 0, y: 0 });

  useEffect(() => {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressRef.current = max > 0 ? window.scrollY / max : 0;
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050911, 0.018);

    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, 0.1, 170);
    camera.position.set(-12, 9.5, 24);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xaec9ff, 0x22321c, 1.6);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff6df, 3.8);
    sun.position.set(-12, 20, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 70;
    scene.add(sun);

    const world = new THREE.Group();
    scene.add(world);

    const ground = cylinder(29, 32, 1.0, 0x122016, 48, { roughness: 0.95 });
    ground.position.y = -0.56;
    world.add(ground);

    const moss = cylinder(27, 29, 0.2, 0x1b3e26, 48, { roughness: 0.98 });
    moss.position.y = 0.02;
    world.add(moss);

    const curve = new THREE.CatmullRomCurve3(trailPoints, false, "catmullrom", 0.22);
    const trail = new THREE.Mesh(makeRibbonGeometry(curve, 180, 0.68, { yLift: 0.075, edgeJitter: 0.18, widthWave: 0.28 }), makeMat(0x8e683d, { roughness: 0.98 }));
    trail.receiveShadow = true;
    world.add(trail);

    for (let i = 0; i < 54; i += 1) {
      const t = i / 54;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const pebble = sphere(0.08 + Math.random() * 0.12, 0x6a6254, 8, 6, { flatShading: true });
      pebble.scale.set(1.4, 0.38, 0.82);
      pebble.position.copy(point).addScaledVector(normal, side * (0.72 + Math.random() * 0.28));
      pebble.position.y = 0.14;
      pebble.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
      world.add(pebble);
    }

    addWater(world);
    addTrailMarkers(world);

    const treeTypes = [addConifer, addBroadleaf, addBirch];
    for (let i = 0; i < 76; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 9 + Math.random() * 19;
      const x = Math.cos(angle) * radius + 2;
      const z = Math.sin(angle) * radius;
      const nearTrail = trailPoints.some((point) => Math.hypot(point.x - x, point.z - z) < 2.4);
      if (nearTrail) continue;
      treeTypes[i % treeTypes.length](world, x, z, 0.62 + Math.random() * 0.9);
    }

    for (let i = 0; i < 86; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4 + Math.random() * 24;
      addGrassPatch(world, Math.cos(angle) * radius + 2, Math.sin(angle) * radius, 0.7 + Math.random() * 0.8);
    }

    for (let i = 0; i < 210; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 27;
      const x = Math.cos(angle) * radius + 1.5;
      const z = Math.sin(angle) * radius;
      const nearWater = z < -2 && Math.random() > 0.25;
      addGrassPatch(world, x, z, (nearWater ? 0.65 : 0.45) + Math.random() * 0.55);
    }

    for (let i = 0; i < 58; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4 + Math.random() * 23;
      addFlowerPatch(world, Math.cos(angle) * radius + 2, Math.sin(angle) * radius, 0.7 + Math.random() * 0.7);
    }

    for (let i = 0; i < 30; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 7 + Math.random() * 22;
      addRock(world, Math.cos(angle) * radius, Math.sin(angle) * radius, 0.22 + Math.random() * 0.55);
    }

    for (let i = 0; i < 13; i += 1) {
      addSnowPatch(world, 10 + Math.random() * 16, 2 + Math.random() * 12, 0.42 + Math.random() * 0.72);
    }

    addWildlife(world);

    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
          Array.from({ length: 900 }, () => 0).flatMap(() => [
            (Math.random() - 0.5) * 92,
            13 + Math.random() * 40,
            (Math.random() - 0.5) * 88,
          ]),
          3,
        ),
      ),
      new THREE.PointsMaterial({ color: 0xf8f1d8, size: 0.055, transparent: true, opacity: 0.86 }),
    );
    world.add(stars);

    const snowPositions = [];
    for (let i = 0; i < 520; i += 1) {
      snowPositions.push((Math.random() - 0.5) * 58, 4 + Math.random() * 28, (Math.random() - 0.5) * 52);
    }
    const snowGeometry = new THREE.BufferGeometry();
    snowGeometry.setAttribute("position", new THREE.Float32BufferAttribute(snowPositions, 3));
    const snow = new THREE.Points(
      snowGeometry,
      new THREE.PointsMaterial({ color: 0xf7fbff, size: 0.075, transparent: true, opacity: 0.68 }),
    );
    snow.userData.snow = { velocities: Array.from({ length: 520 }, () => 0.015 + Math.random() * 0.035) };
    world.add(snow);

    const hiker = createHiker();
    world.add(hiker);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const cameraTarget = new THREE.Vector3();
    const nextPoint = new THREE.Vector3();
    const currentPoint = new THREE.Vector3();
    const desiredCamera = new THREE.Vector3();
    const clock = new THREE.Clock();
    let frame = 0;

    const findClickableAnimal = (object) => {
      let target = object;
      while (target) {
        if (target.userData.clickAnimal) return target;
        target = target.parent;
      }
      return null;
    };

    const makeAnimalRun = (animal) => {
      const until = clock.getElapsedTime() + 2.2;
      animal.userData.runUntil = until;
      if (animal.userData.elk) animal.userData.elk.runUntil = until;
      if (animal.userData.rabbit) animal.userData.rabbit.runUntil = until;
      if (animal.userData.fox) animal.userData.fox.runUntil = until;
      if (animal.userData.bird !== undefined) animal.userData.runUntil = until;
    };

    const tryAnimalClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(world.children, true);
      const animal = hits.map((hit) => findClickableAnimal(hit.object)).find(Boolean);
      if (animal) makeAnimalRun(animal);
    };

    const onPointerDown = (event) => {
      orbitRef.current.dragging = true;
      orbitRef.current.x = event.clientX;
      orbitRef.current.y = event.clientY;
      orbitRef.current.downX = event.clientX;
      orbitRef.current.downY = event.clientY;
      orbitRef.current.moved = false;
      renderer.domElement.setPointerCapture(event.pointerId);
      host.classList.add("is-dragging");
    };

    const onPointerMove = (event) => {
      if (!orbitRef.current.dragging) return;
      const dx = event.clientX - orbitRef.current.x;
      const dy = event.clientY - orbitRef.current.y;
      orbitRef.current.x = event.clientX;
      orbitRef.current.y = event.clientY;
      if (Math.hypot(event.clientX - orbitRef.current.downX, event.clientY - orbitRef.current.downY) > 7) {
        orbitRef.current.moved = true;
      }
      orbitRef.current.yaw += dx * 0.006;
      orbitRef.current.pitch = THREE.MathUtils.clamp(orbitRef.current.pitch + dy * 0.0035, -0.48, 0.56);
    };

    const endDrag = (event) => {
      const wasClick = !orbitRef.current.moved && Math.hypot(event.clientX - orbitRef.current.downX, event.clientY - orbitRef.current.downY) <= 7;
      orbitRef.current.dragging = false;
      host.classList.remove("is-dragging");
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      if (wasClick) tryAnimalClick(event);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", endDrag);
    renderer.domElement.addEventListener("pointercancel", endDrag);

    const resize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener("resize", resize);

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const progress = THREE.MathUtils.clamp(progressRef.current, 0, 0.999);
      const orbit = orbitRef.current;

      curve.getPointAt(progress, currentPoint);
      curve.getPointAt(Math.min(progress + 0.012, 1), nextPoint);
      hiker.position.copy(currentPoint);
      hiker.position.y += 0.06 + Math.sin(elapsed * 5.8) * 0.04;
      hiker.lookAt(nextPoint.x, nextPoint.y, nextPoint.z);
      hiker.rotateY(Math.PI);

      cameraTarget.set(currentPoint.x + 2.4, 1.9, currentPoint.z);
      const baseYaw = -0.42 + progress * 0.56 + orbit.yaw;
      const radius = 34;
      desiredCamera.set(
        cameraTarget.x + Math.sin(baseYaw) * radius,
        cameraTarget.y + 13.4 + orbit.pitch * 8,
        cameraTarget.z + Math.cos(baseYaw) * radius,
      );
      camera.position.lerp(desiredCamera, orbit.dragging ? 0.18 : 0.045);
      camera.lookAt(cameraTarget);

      world.rotation.y = THREE.MathUtils.lerp(world.rotation.y, -0.18 + progress * 0.28, 0.025);
      stars.rotation.y += 0.00035;

      scene.traverse((object) => {
        if (object.userData.sway) {
          object.rotation.x = Math.sin(elapsed * 0.9 + object.userData.sway.phase) * object.userData.sway.strength;
          object.rotation.z = Math.cos(elapsed * 0.72 + object.userData.sway.phase) * object.userData.sway.strength * 0.72;
        }
        if (object.userData.grass) {
          object.rotation.x = object.userData.grass.baseX + Math.sin(elapsed * 1.5 + object.userData.grass.phase) * object.userData.grass.strength;
          object.rotation.z = object.userData.grass.baseZ + Math.cos(elapsed * 1.2 + object.userData.grass.phase) * object.userData.grass.strength;
        }
        if (object.userData.waterBead) {
          object.position.y = object.userData.waterBead.baseY + Math.sin(elapsed * 2.2 + object.userData.waterBead.phase) * 0.035;
          object.rotation.y += 0.008;
        }
        if (object.userData.bird !== undefined) {
          const running = object.userData.runUntil && object.userData.runUntil > elapsed;
          const bird = object.userData.bird;
          const speed = running ? 3.2 : 0.8;
          object.position.x = bird.base.x + Math.sin(elapsed * speed + bird.phase) * bird.driftX;
          object.position.y = bird.base.y + Math.cos(elapsed * (running ? 4.5 : 1.2) + bird.phase) * bird.driftY;
          object.position.z = bird.base.z + Math.cos(elapsed * (running ? 2.4 : 0.65) + bird.phase) * bird.driftZ;
          object.rotation.z = Math.sin(elapsed * (running ? 12 : 3) + bird.phase) * (running ? 0.18 : 0.05);
          object.rotation.y = Math.sin(elapsed * 0.35 + bird.phase) * 0.5;
        }
        if (object.userData.elk) {
          const elk = object.userData.elk;
          const running = elk.runUntil && elk.runUntil > elapsed;
          elk.phase = (elk.phase + (running ? 0.0032 : 0.0008)) % 1;
          const point = elk.curve.getPointAt(elk.phase);
          const next = elk.curve.getPointAt((elk.phase + 0.015) % 1);
          object.position.lerp(point, 0.08);
          object.lookAt(next.x, next.y, next.z);
          object.rotation.x = Math.sin(elapsed * (running ? 5.2 : 2.2)) * (running ? 0.045 : 0.015);
          elk.legs.forEach((leg) => {
            leg.rotation.z = Math.sin(elapsed * (running ? 10.5 : 4.2) + leg.userData.legPhase) * (running ? 0.34 : 0.18);
          });
        }
        if (object.userData.rabbit) {
          const rabbit = object.userData.rabbit;
          const running = rabbit.runUntil && rabbit.runUntil > elapsed;
          const speed = running ? 3.1 : 0.9;
          object.position.x = rabbit.base.x + Math.sin(elapsed * speed + rabbit.phase) * (running ? 1.7 : 0.65);
          object.position.z = rabbit.base.z + Math.cos(elapsed * (running ? 2.4 : 0.7) + rabbit.phase) * (running ? 0.9 : 0.35);
          object.position.y = rabbit.base.y + Math.max(0, Math.sin(elapsed * (running ? 9.5 : 3.2) + rabbit.phase)) * (running ? 0.2 : 0.08);
          object.rotation.y = Math.sin(elapsed * speed + rabbit.phase) * 0.8;
        }
        if (object.userData.fox) {
          const fox = object.userData.fox;
          const running = fox.runUntil && fox.runUntil > elapsed;
          fox.phase = (fox.phase + (running ? 0.0048 : 0.0012)) % 1;
          object.position.x = fox.base.x + Math.sin(fox.phase * Math.PI * 2) * 2.6;
          object.position.z = fox.base.z + Math.cos(fox.phase * Math.PI * 2) * 1.15;
          object.rotation.y = -fox.phase * Math.PI * 2 + Math.PI / 2;
          object.rotation.x = Math.sin(elapsed * (running ? 8 : 2.5)) * (running ? 0.06 : 0.02);
        }
      });

      const snowAttribute = snow.geometry.getAttribute("position");
      for (let i = 0; i < snowAttribute.count; i += 1) {
        const y = snowAttribute.getY(i) - snow.userData.snow.velocities[i];
        snowAttribute.setY(i, y < 0.8 ? 29 + Math.random() * 5 : y);
        snowAttribute.setX(i, snowAttribute.getX(i) + Math.sin(elapsed * 0.7 + i) * 0.006);
        snowAttribute.setZ(i, snowAttribute.getZ(i) + Math.cos(elapsed * 0.5 + i * 0.4) * 0.004);
      }
      snowAttribute.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", endDrag);
      renderer.domElement.removeEventListener("pointercancel", endDrag);
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="world"
      data-active-stop={stops[activeIndex]?.id || "rainforest"}
      aria-hidden="true"
    />
  );
}
