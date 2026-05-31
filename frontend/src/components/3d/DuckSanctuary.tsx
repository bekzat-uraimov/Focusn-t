"use client";

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Clone, Float, ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Duck center offset derived from bbox inspection: min [1.02,1.35,-0.33] max [1.84,1.55,0.33]
const DUCK_OFFSET_X = -(1.02 + 1.84) / 2; // -1.43
const DUCK_OFFSET_Y = -(1.35 + 1.55) / 2; // -1.45

// Preload all models
useGLTF.preload("/models/yellow_duck.glb");
useGLTF.preload("/models/low_poly_medieval_island.glb");

// ── Duck ─────────────────────────────────────────────────────────────────────
function DuckModel({
  position,
  scale = 1.2,
  delay = 0,
  rotationY = 0,
}: {
  position: [number, number, number];
  scale?: number;
  delay?: number;
  rotationY?: number;
}) {
  const { scene } = useGLTF("/models/yellow_duck.glb");
  const groupRef = useRef<THREE.Group>(null);

  useFrame((s) => {
    if (!groupRef.current) return;
    groupRef.current.position.y =
      position[1] + Math.sin(s.clock.elapsedTime * 1.8 + delay) * 0.08;
    groupRef.current.rotation.y =
      rotationY + Math.sin(s.clock.elapsedTime * 0.7 + delay) * 0.2;
  });

  return (
    <group ref={groupRef} position={position}>
      <Clone
        object={scene}
        scale={scale}
        position={[DUCK_OFFSET_X * scale, DUCK_OFFSET_Y * scale, 0]}
        castShadow
      />
    </group>
  );
}

// ── Island + decorations ──────────────────────────────────────────────────────
function IslandScene() {
  const { scene } = useGLTF("/models/low_poly_medieval_island.glb");

  // Water disc bbox: [-1,0,-1] to [1,0,1] at scale 1.
  // Scale 1.6 → water is ~1.6 units radius. Island floats via Float wrapper.
  const islandScale = 0.08;

  // Water surface sits at y=0 in model space.
  // Ducks sit just above it — y=0.06 keeps them on the surface.
  // Keep x/z within water disc radius (~1.4 units after scale).
  return (
    <group>
      {/* Island model — already contains water, grass, well, fences, flowers */}
      <primitive
        object={scene}
        scale={islandScale}
        position={[0, 0, 0]}
        receiveShadow
        castShadow
      />

      {/* Ducks on the water */}
      <DuckModel position={[ 0.04, 0.04,  0.02]} scale={0.04} delay={0}   rotationY={0.5} />
      <DuckModel position={[-0.05, 0.04,  0.04]} scale={0.03} delay={1.3} rotationY={-0.9} />
      <DuckModel position={[ 0.05, 0.04, -0.04]} scale={0.035} delay={0.7} rotationY={2.0} />
    </group>
  );
}

// ── Scene lighting ─────────────────────────────────────────────────────────────
function Scene() {
  return (
    <>
      {/* Warm ambient */}
      <ambientLight intensity={0.8} color="#fff8f0" />

      {/* Main sun — top-right, strong for hard CoC shadows */}
      <directionalLight
        position={[8, 12, 5]}
        intensity={1.8}
        color="#fff8e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={40}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Fill light — cool from opposite side */}
      <directionalLight position={[-5, 6, -4]} intensity={0.35} color="#d0e8ff" />

      {/* Soft contact shadow under floating island */}
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.4}
        scale={6}
        blur={2.5}
        far={5}
        color="#334"
      />

      {/* Floating island + everything on it */}
      <Float speed={0.7} rotationIntensity={0.04} floatIntensity={0.35}>
        <IslandScene />
      </Float>
    </>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────────
interface DuckSanctuaryProps {
  width?: number;
  height?: number;
  showOrbit?: boolean;
}

export function DuckSanctuary({ width = 520, height = 480, showOrbit = false }: DuckSanctuaryProps) {
  return (
    <div style={{ width, height }}>
      <Canvas
        camera={{ position: [3.5, 3, 3.5], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene />
          {showOrbit && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.6}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2.4}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
