import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Preload } from "@react-three/drei";
import * as THREE from "three";

const Particles = () => {
  const ref = useRef();

  // Generate 1800 random points distributed in a 3D sphere volume
  const positions = useMemo(() => {
    const coords = new Float32Array(1800 * 3);
    for (let i = 0; i < 1800; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 11;
      const sinPhi = Math.sin(phi);
      coords[i * 3] = r * sinPhi * Math.cos(theta);
      coords[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      coords[i * 3 + 2] = r * Math.cos(phi);
    }
    return coords;
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    // Gentle continuous cosmic drift
    ref.current.rotation.x -= delta * 0.025;
    ref.current.rotation.y -= delta * 0.035;

    // Subtle pointer parallax offset
    const targetX = state.pointer.x * 0.25;
    const targetY = state.pointer.y * 0.25;
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, targetX, 0.04);
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, 0.04);
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#818cf8"
          size={0.035}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.55}
        />
      </Points>
      <Preload all />
    </group>
  );
};

const ParticleField = () => {
  return (
    <div
      className="absolute inset-0 w-full h-full -z-10 pointer-events-none bg-[#050714]"
      style={{ width: "100%", height: "100%", position: "fixed", top: 0, left: 0 }}
    >
      <Canvas
        eventSource={typeof document !== "undefined" ? document.getElementById("root") : undefined}
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 2]}
        gl={{ powerPreference: "high-performance", antialias: false, alpha: true, preserveDrawingBuffer: false }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
        <Particles />
      </Canvas>
    </div>
  );
};

export default ParticleField;
