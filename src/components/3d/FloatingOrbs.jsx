import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Stars, Preload } from "@react-three/drei";
import * as THREE from "three";

const AnimatedTorusKnot = () => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.25;
    meshRef.current.rotation.y += delta * 0.35;

    // React dynamically to cursor position
    const targetX = -2.2 + state.pointer.x * 0.7;
    const targetY = 0.3 + state.pointer.y * 0.7;
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.05);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.05);
  });

  return (
    <Float speed={2.2} rotationIntensity={1.2} floatIntensity={1.6}>
      <mesh ref={meshRef} position={[-2.2, 0.3, 0]} scale={0.9}>
        <torusKnotGeometry args={[1, 0.32, 128, 32]} />
        <MeshDistortMaterial
          color="#6366f1"
          distort={0.35}
          speed={2.2}
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>
    </Float>
  );
};

const AnimatedIcosahedron = () => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x -= delta * 0.3;
    meshRef.current.rotation.z += delta * 0.25;

    const targetX = 2.4 + state.pointer.x * 0.6;
    const targetY = -1.2 + state.pointer.y * 0.6;
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.05);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.05);
  });

  return (
    <Float speed={2.6} rotationIntensity={1.8} floatIntensity={2}>
      <mesh ref={meshRef} position={[2.4, -1.2, -0.5]} scale={1.15}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#d946ef"
          roughness={0.2}
          metalness={0.8}
          wireframe={false}
        />
      </mesh>
    </Float>
  );
};

const GlowingSphere = () => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.4;

    const targetX = 1.6 + state.pointer.x * 0.4;
    const targetY = 1.8 + state.pointer.y * 0.4;
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.05);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.05);
  });

  return (
    <Float speed={3} rotationIntensity={1} floatIntensity={1.8}>
      <mesh ref={meshRef} position={[1.6, 1.8, -1.2]} scale={0.65}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color="#06b6d4"
          distort={0.45}
          speed={3}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </Float>
  );
};

const Scene = () => {
  const centralTorusRef = useRef();

  useFrame((_, delta) => {
    if (centralTorusRef.current) {
      centralTorusRef.current.rotation.x += delta * 0.2;
      centralTorusRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <>
      {/* High-intensity Ambient & Directional Lighting */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#818cf8" />
      <pointLight position={[-6, 4, 3]} intensity={3} color="#6366f1" distance={20} />
      <pointLight position={[6, -4, 3]} intensity={3} color="#ec4899" distance={20} />
      <pointLight position={[0, -2, 4]} intensity={2.5} color="#06b6d4" distance={15} />

      <Stars
        radius={60}
        depth={40}
        count={1500}
        factor={3.5}
        saturation={0.5}
        fade
        speed={1}
      />

      {/* Massive Central Rotating Wireframe TorusKnot */}
      <Float speed={1.8} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh ref={centralTorusRef} position={[0, 0, -2]} scale={1.8}>
          <torusKnotGeometry args={[1.2, 0.35, 128, 32]} />
          <meshStandardMaterial
            color="#6366f1"
            emissive="#4338ca"
            emissiveIntensity={0.6}
            wireframe={true}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </Float>

      <AnimatedTorusKnot />
      <AnimatedIcosahedron />
      <GlowingSphere />

      {/* Pre-compile all shaders and geometries into GPU memory */}
      <Preload all />
    </>
  );
};

const FloatingOrbs = () => {
  return (
    <div
      className="absolute inset-0 w-full h-full -z-10 pointer-events-none"
      style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
    >
      <Canvas
        eventSource={typeof document !== "undefined" ? document.getElementById("root") : undefined}
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 2]}
        gl={{ powerPreference: "high-performance", antialias: false, alpha: true, preserveDrawingBuffer: false }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
};

export default FloatingOrbs;
