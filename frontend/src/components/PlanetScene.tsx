"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, useGLTF, Float, Line } from "@react-three/drei";
import * as THREE from "three";

// Only models without spaces in filename
const MODELS = [
  "/models/little_earth.glb",
  "/models/planet_earth_one.glb",
  "/models/grounded_planet.glb",
  "/models/second_earth.glb",
];

MODELS.forEach((p) => useGLTF.preload(p));

const SYSTEM_CENTER = new THREE.Vector3(5.5, 0.8, -2);
const JOURNEY_START = new THREE.Vector3(-7, -1.5, 1);
const JOURNEY_END = new THREE.Vector3(5.5, 0.8, -2);

// Base system planets always present
const BASE_ORBITS = [
  { modelIdx: 1, radius: 3.0, speed: 0.14, offset: 0, yBias: 0.4, scale: 0.95 },
  { modelIdx: 2, radius: 1.8, speed: -0.22, offset: Math.PI / 2.5, yBias: -0.3, scale: 0.70 },
  { modelIdx: 3, radius: 4.2, speed: 0.09, offset: Math.PI, yBias: 0.6, scale: 0.58 },
];

interface OrbitProps {
  modelIdx: number;
  radius: number;
  speed: number;
  offset: number;
  yBias: number;
  scale: number;
}

function OrbitingPlanet({ modelIdx, radius, speed, offset, yBias, scale }: OrbitProps) {
  const ref = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODELS[modelIdx % MODELS.length]);
  const mesh = useMemo(() => scene.clone(true), [scene]);
  const angle = useRef(offset);

  useFrame((_, dt) => {
    if (!ref.current) return;
    angle.current += dt * speed;
    ref.current.position.set(
      SYSTEM_CENTER.x + Math.cos(angle.current) * radius,
      SYSTEM_CENTER.y + yBias + Math.sin(angle.current * 0.6) * 0.25,
      SYSTEM_CENTER.z + Math.sin(angle.current) * radius * 0.45
    );
    ref.current.rotation.y += dt * 0.18;
    ref.current.rotation.x += dt * 0.04;
  });

  return (
    <group ref={ref} scale={scale}>
      <primitive object={mesh} />
    </group>
  );
}

// Extra collected planets — deterministic orbits from index
function CollectedPlanet({ index }: { index: number }) {
  const orbit: OrbitProps = {
    modelIdx: (index + 1) % MODELS.length,
    radius: 1.1 + ((index % 4) * 0.9),
    speed: (index % 2 === 0 ? 1 : -1) * (0.07 + index * 0.025),
    offset: (index / 6) * Math.PI * 2,
    yBias: ((index % 3) - 1) * 0.35,
    scale: 0.28 + (index % 3) * 0.12,
  };
  return <OrbitingPlanet {...orbit} />;
}

interface JourneyProps {
  progress: number;
  hasFailed: boolean;
  isActive: boolean;
  modelIndex: number;
}

const TARGET_SCALE = new THREE.Vector3(1.0, 1.0, 1.0);
const ZERO_SCALE = new THREE.Vector3(0.001, 0.001, 0.001);

function JourneyPlanet({ progress, hasFailed, isActive, modelIndex }: JourneyProps) {
  const ref = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODELS[modelIndex % MODELS.length]);
  const mesh = useMemo(() => scene.clone(true), [scene]);
  const posRef = useRef(JOURNEY_START.clone());

  useFrame((_, dt) => {
    if (!ref.current) return;

    ref.current.rotation.y += dt * 0.28;
    ref.current.rotation.x += dt * 0.06;

    if (hasFailed) {
      posRef.current.lerp(JOURNEY_START, 0.055);
      ref.current.position.copy(posRef.current);
      ref.current.scale.lerp(ZERO_SCALE, 0.09);
      return;
    }

    if (isActive || progress >= 1) {
      const t = Math.min(progress, 1);
      // Arc path: parabola in Y so the planet curves through space
      const arcLift = Math.sin(t * Math.PI) * 2.0;
      const target = new THREE.Vector3(
        THREE.MathUtils.lerp(JOURNEY_START.x, JOURNEY_END.x, t),
        THREE.MathUtils.lerp(JOURNEY_START.y, JOURNEY_END.y, t) + arcLift,
        THREE.MathUtils.lerp(JOURNEY_START.z, JOURNEY_END.z, t)
      );
      posRef.current.lerp(target, 0.06);
      ref.current.position.copy(posRef.current);
      ref.current.scale.lerp(TARGET_SCALE, 0.05);
    } else {
      // Idle — reset silently
      posRef.current.copy(JOURNEY_START);
      ref.current.position.copy(JOURNEY_START);
      ref.current.scale.copy(ZERO_SCALE);
    }
  });

  return (
    <group ref={ref} position={[JOURNEY_START.x, JOURNEY_START.y, JOURNEY_START.z]} scale={0.001}>
      <primitive object={mesh} />
    </group>
  );
}

function OrbitPath({ isActive, isDark }: { isActive: boolean; isDark: boolean }) {
  const points = useMemo<[number, number, number][]>(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      pts.push([
        THREE.MathUtils.lerp(JOURNEY_START.x, JOURNEY_END.x, t),
        THREE.MathUtils.lerp(JOURNEY_START.y, JOURNEY_END.y, t) + Math.sin(t * Math.PI) * 2.0,
        THREE.MathUtils.lerp(JOURNEY_START.z, JOURNEY_END.z, t),
      ]);
    }
    return pts;
  }, []);

  if (!isActive) return null;

  return (
    <Line
      points={points}
      color="white"
      lineWidth={0.4}
      dashed
      dashSize={0.06}
      gapSize={0.22}
      opacity={isDark ? 0.25 : 0.18}
      transparent
    />
  );
}

// Glowing core at system center
function SystemCore({ score }: { score: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const s = 0.16 + Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
    ref.current.scale.setScalar(s);
  });

  const emissive = score >= 75 ? "#4f46e5" : score >= 50 ? "#d97706" : "#dc2626";

  return (
    <Float speed={0.6} floatIntensity={0.4}>
      <mesh ref={ref} position={[SYSTEM_CENTER.x, SYSTEM_CENTER.y, SYSTEM_CENTER.z]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive={emissive}
          emissiveIntensity={4}
          transparent
          opacity={0.55}
        />
      </mesh>
    </Float>
  );
}

interface PlanetSceneProps extends JourneyProps {
  collectedCount: number;
  isDark: boolean;
  attentionScore: number;
}

export default function PlanetScene({
  progress,
  hasFailed,
  isActive,
  modelIndex,
  collectedCount,
  isDark,
  attentionScore,
}: PlanetSceneProps) {
  const extra = Math.min(collectedCount, 8);

  return (
    <Canvas
      camera={{ position: [0, 2, 10], fov: 52 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        {/* Stars only in night mode */}
        {isDark && (
          <Stars radius={140} depth={70} count={5500} factor={3.5} saturation={0.08} fade speed={0.25} />
        )}

        {/* Lighting */}
        <ambientLight intensity={isDark ? 0.12 : 0.9} />
        <directionalLight position={[12, 18, 8]} intensity={isDark ? 2.2 : 3.8} color={isDark ? "#fff8f2" : "#fffde7"} />
        {isDark && (
          <>
            <pointLight position={[SYSTEM_CENTER.x, SYSTEM_CENTER.y + 1, SYSTEM_CENTER.z + 3]} intensity={1.2} color="#818cf8" distance={18} />
            <pointLight position={[-8, -2, 4]} intensity={0.5} color="#38bdf8" distance={25} />
          </>
        )}
        {!isDark && (
          <directionalLight position={[-6, 12, 6]} intensity={1.8} color="#fff9e6" />
        )}

        {/* System core glow */}
        <SystemCore score={attentionScore} />

        {/* Base orbiting planets */}
        {BASE_ORBITS.map((o, i) => (
          <OrbitingPlanet key={i} {...o} />
        ))}

        {/* Collected session planets */}
        {Array.from({ length: extra }, (_, i) => (
          <CollectedPlanet key={i} index={i} />
        ))}

        {/* Journey arc */}
        <OrbitPath isActive={isActive} isDark={isDark} />

        {/* Journey planet */}
        <JourneyPlanet
          progress={progress}
          hasFailed={hasFailed}
          isActive={isActive}
          modelIndex={modelIndex}
        />
      </Suspense>
    </Canvas>
  );
}
