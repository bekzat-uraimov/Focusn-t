"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, useGLTF, Float } from "@react-three/drei";
import * as THREE from "three";

const MODELS = [
  "/models/little_earth.glb",
  "/models/planet_earth_one.glb",
  "/models/grounded_planet.glb",
  "/models/second_earth.glb",
];
MODELS.forEach((p) => useGLTF.preload(p));

function Planet({
  modelIdx,
  position,
  scale,
  spinY,
  spinX,
  floatSpeed,
  floatIntensity,
}: {
  modelIdx: number;
  position: [number, number, number];
  scale: number;
  spinY: number;
  spinX: number;
  floatSpeed: number;
  floatIntensity: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODELS[modelIdx]);
  const mesh = useMemo(() => scene.clone(true), [scene]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * spinY;
    ref.current.rotation.x += dt * spinX;
  });

  return (
    <Float speed={floatSpeed} floatIntensity={floatIntensity} rotationIntensity={0.08}>
      <group ref={ref} position={position} scale={scale}>
        <primitive object={mesh} />
      </group>
    </Float>
  );
}

export default function SigninScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 55 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <Stars
          radius={160}
          depth={80}
          count={7000}
          factor={4}
          saturation={0.08}
          fade
          speed={0.18}
        />

        <ambientLight intensity={0.13} />
        <directionalLight
          position={[15, 20, 8]}
          intensity={2.4}
          color="#fff8f0"
        />
        <pointLight
          position={[-6, 4, 6]}
          intensity={2.0}
          color="#818cf8"
          distance={24}
        />
        <pointLight
          position={[10, -3, 4]}
          intensity={1.1}
          color="#38bdf8"
          distance={20}
        />
        <pointLight
          position={[0, 2, 10]}
          intensity={0.35}
          color="#c084fc"
          distance={14}
        />

        {/* Large hero planet — upper left, anchors the welcome side */}
        <Planet
          modelIdx={1}
          position={[-7.5, 3.5, -2]}
          scale={1.5}
          spinY={0.11}
          spinX={0.03}
          floatSpeed={0.65}
          floatIntensity={0.5}
        />
        {/* Medium planet — upper right, behind / above the form */}
        <Planet
          modelIdx={0}
          position={[7.5, 2.8, -1]}
          scale={1.0}
          spinY={0.17}
          spinX={0.05}
          floatSpeed={0.85}
          floatIntensity={0.6}
        />
        {/* Small planet — lower right */}
        <Planet
          modelIdx={3}
          position={[5.8, -3.6, 0.5]}
          scale={0.68}
          spinY={0.21}
          spinX={0.07}
          floatSpeed={1.05}
          floatIntensity={0.7}
        />
        {/* Medium planet — lower left */}
        <Planet
          modelIdx={2}
          position={[-5.2, -3.2, -1]}
          scale={0.82}
          spinY={0.15}
          spinX={0.04}
          floatSpeed={0.72}
          floatIntensity={0.52}
        />
        {/* Tiny accent — deep center, creates depth */}
        <Planet
          modelIdx={0}
          position={[1.5, 1.8, -8]}
          scale={0.36}
          spinY={0.28}
          spinX={0.09}
          floatSpeed={1.3}
          floatIntensity={0.85}
        />
      </Suspense>
    </Canvas>
  );
}
