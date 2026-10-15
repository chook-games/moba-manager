import { ROLE_COLORS } from '../data/champions.js';

// Low-poly builders. THREE is the global provided by the three.js CDN script.

export function createStructureMesh(team, type) {
  const group = new THREE.Group();
  const isBlue = team === 'blue';
  const mainColor = isBlue ? 0x0ea5e9 : 0xef4444;
  const glowColor = isBlue ? 0x38bdf8 : 0xf87171;

  if (type === 'nexus') {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 3.1, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
    );
    base.position.y = 0.4;
    group.add(base);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.7, 3.1, 24),
      new THREE.MeshBasicMaterial({ color: mainColor, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    group.add(ring);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.65, 0),
      new THREE.MeshStandardMaterial({
        color: mainColor, emissive: glowColor, emissiveIntensity: 0.45, roughness: 0.2, metalness: 0.3,
      })
    );
    crystal.position.y = 2.6;
    crystal.scale.set(1, 1.35, 1);
    group.add(crystal);
    group.userData.crystal = crystal;
  } else if (type === 'turret') {
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 3.2, 2.1),
      new THREE.MeshStandardMaterial({ color: isBlue ? 0x1e3a5f : 0x4c1d24, roughness: 0.5 })
    );
    tower.position.y = 1.6;
    group.add(tower);

    const topCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.95, 0),
      new THREE.MeshStandardMaterial({ color: mainColor, emissive: glowColor, emissiveIntensity: 0.5 })
    );
    topCrystal.position.y = 3.9;
    group.add(topCrystal);
    group.userData.crystal = topCrystal;

    const rangeRing = new THREE.Mesh(
      new THREE.RingGeometry(10.8, 11.0, 36),
      new THREE.MeshBasicMaterial({ color: mainColor, side: THREE.DoubleSide, transparent: true, opacity: 0.22 })
    );
    rangeRing.rotation.x = -Math.PI / 2;
    rangeRing.position.y = 0.05;
    group.add(rangeRing);
  }

  return group;
}

export function createChampionMesh(champData, team) {
  const group = new THREE.Group();
  const isBlue = team === 'blue';
  const teamColor = isBlue ? 0x0ea5e9 : 0xef4444;
  const roleColor = (ROLE_COLORS[champData.role] || ROLE_COLORS.Fighter).threeColor;

  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.32, 24),
    new THREE.MeshBasicMaterial({ color: teamColor, side: THREE.DoubleSide })
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = 0.06;
  group.add(baseRing);

  const selRing = new THREE.Mesh(
    new THREE.RingGeometry(1.42, 1.72, 28),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  selRing.rotation.x = -Math.PI / 2;
  selRing.position.y = 0.08;
  selRing.visible = false;
  group.add(selRing);
  group.userData.selRing = selRing;

  const shieldMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.0, wireframe: true })
  );
  shieldMesh.position.y = 1.2;
  group.add(shieldMesh);
  group.userData.shieldMesh = shieldMesh;

  // Large invisible hit volume so tapping a champion is forgiving on touch.
  const hitMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 1.9, 3.4, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.y = 1.7;
  group.add(hitMesh);
  group.userData.hitMesh = hitMesh;

  const bodyGroup = new THREE.Group();
  const armorMat = new THREE.MeshStandardMaterial({ color: isBlue ? 0x1e3a8a : 0x7f1d1d, roughness: 0.5 });
  const roleMat = new THREE.MeshStandardMaterial({ color: roleColor, emissive: roleColor, emissiveIntensity: 0.2, roughness: 0.4 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });

  buildRoleBody(bodyGroup, champData.role, armorMat, roleMat, headMat, steelMat);
  group.add(bodyGroup);
  group.userData.bodyGroup = bodyGroup;
  return group;
}

function buildRoleBody(g, role, armorMat, roleMat, headMat, steelMat) {
  if (role === 'Tank') {
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.5, 0.9), armorMat);
    torso.position.y = 0.95; g.add(torso);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), headMat);
    head.position.y = 1.95; g.add(head);
    const shield = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.35, 0.2), roleMat);
    shield.position.set(0, 1.0, 0.65); g.add(shield);
  } else if (role === 'Mage') {
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.75, 8), armorMat);
    robe.position.y = 0.9; g.add(robe);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), headMat);
    head.position.y = 1.95; g.add(head);
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2), steelMat);
    staff.position.set(0.65, 1.1, 0.3); g.add(staff);
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), roleMat);
    orb.position.set(0.65, 2.35, 0.3); g.add(orb);
  } else if (role === 'Marksman') {
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.58, 1.45, 10), armorMat);
    torso.position.y = 0.85; g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12), headMat);
    head.position.y = 1.85; g.add(head);
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 1.45), roleMat);
    gun.position.set(0.45, 1.15, 0.55); g.add(gun);
  } else if (role === 'Assassin') {
    const torso = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.5, 6), armorMat);
    torso.position.y = 0.85; g.add(torso);
    const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), headMat);
    head.position.y = 1.85; g.add(head);
    const daggerGeo = new THREE.BoxGeometry(0.14, 0.14, 1.05);
    const dl = new THREE.Mesh(daggerGeo, roleMat); dl.position.set(-0.6, 0.95, 0.45); g.add(dl);
    const dr = new THREE.Mesh(daggerGeo, roleMat); dr.position.set(0.6, 0.95, 0.45); g.add(dr);
  } else if (role === 'Support') {
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.72, 1.5, 12), armorMat);
    torso.position.y = 0.85; g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12), headMat);
    head.position.y = 1.85; g.add(head);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.07, 8, 20), roleMat);
    halo.rotation.x = Math.PI / 2; halo.position.y = 2.45; g.add(halo);
  } else {
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.45, 0.7), armorMat);
    torso.position.y = 0.85; g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), headMat);
    head.position.y = 1.85; g.add(head);
    const sword = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.6, 0.12), roleMat);
    sword.position.set(0.65, 1.35, 0.4); sword.rotation.x = Math.PI / 6; g.add(sword);
  }
}

export function createMinionMesh(team) {
  const isBlue = team === 'blue';
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.75, 0.62),
    new THREE.MeshStandardMaterial({ color: isBlue ? 0x38bdf8 : 0xf87171, roughness: 0.6 })
  );
  body.position.y = 0.4;
  group.add(body);
  return group;
}

export function clearThreeGroup(grp) {
  if (!grp) return;
  while (grp.children.length > 0) grp.remove(grp.children[0]);
}
