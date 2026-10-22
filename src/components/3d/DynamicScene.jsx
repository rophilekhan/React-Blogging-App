import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles, Preload } from "@react-three/drei";
import * as THREE from "three";

// ── 1. Tech & Engineering Scene: Wireframe Nodes & Geometry ──────────────────
const TechNodes = () => {
  const groupRef = useRef();
  const nodes = useMemo(() => {
    return [
      { pos: [-2.2, 1.2, -1], scale: 0.6 },
      { pos: [2.0, -1.0, -0.5], scale: 0.75 },
      { pos: [-1.8, -2.5, 0], scale: 0.5 },
      { pos: [2.2, 2.0, -1.5], scale: 0.65 },
      { pos: [0, 0, -2], scale: 1.2 },
    ];
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.x += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Wireframe Core */}
      <Float speed={2} rotationIntensity={0.8} floatIntensity={1}>
        <mesh position={[0, 0, -1]}>
          <icosahedronGeometry args={[1.6, 1]} />
          <meshStandardMaterial
            color="#38bdf8"
            wireframe
            emissive="#0284c7"
            emissiveIntensity={0.6}
          />
        </mesh>
      </Float>

      {/* Orbiting Tech Nodes */}
      {nodes.map((node, i) => (
        <Float key={i} speed={2 + i * 0.5} floatIntensity={1.2}>
          <mesh position={node.pos} scale={node.scale}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#6366f1"
              wireframe
              emissive="#4338ca"
              emissiveIntensity={0.8}
            />
          </mesh>
        </Float>
      ))}

      {/* Connecting Geometric Lines */}
      <mesh rotation={[Math.PI / 4, Math.PI / 6, 0]} position={[0, 0, -1]}>
        <ringGeometry args={[2.5, 2.53, 32]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// ── 2. Music & Audio Scene: Oscillating Visualizer Frequency Bars ─────────────
const MusicBars = () => {
  const barsRef = useRef([]);
  const count = 24;

  const barPositions = useMemo(() => {
    const list = [];
    const radius = 2.4;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      list.push({ x, z, angle });
    }
    return list;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    barsRef.current.forEach((mesh, i) => {
      if (mesh) {
        // Synthesize dynamic harmonic wave modulation
        const scaleY = Math.sin(t * 3.5 + i * 0.4) * 0.9 + 1.3;
        mesh.scale.y = scaleY;
      }
    });
  });

  return (
    <group rotation={[Math.PI / 4, 0, 0]}>
      {barPositions.map((bar, i) => (
        <mesh
          key={i}
          ref={(el) => (barsRef.current[i] = el)}
          position={[bar.x, 0, bar.z]}
          rotation={[0, -bar.angle, 0]}
        >
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#ec4899" : "#a855f7"}
            emissive={i % 2 === 0 ? "#be185d" : "#7c3aed"}
            emissiveIntensity={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Center Soundwave Sphere */}
      <Float speed={3} rotationIntensity={1.5} floatIntensity={1.5}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.9, 32, 32]} />
          <MeshDistortMaterial
            color="#f43f5e"
            distort={0.4}
            speed={4}
            roughness={0.15}
          />
        </mesh>
      </Float>
    </group>
  );
};

// ── 3. Design & General Scene: Morphing Crystalline Rings ─────────────────────
const DesignRings = () => {
  const torusRef = useRef();

  useFrame((_, delta) => {
    if (torusRef.current) {
      torusRef.current.rotation.x += delta * 0.25;
      torusRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.2}>
      <mesh ref={torusRef} position={[0, 0, -1]}>
        <torusKnotGeometry args={[1.3, 0.35, 128, 32]} />
        <MeshDistortMaterial
          color="#a855f7"
          distort={0.4}
          speed={2.5}
          roughness={0.1}
          metalness={0.85}
        />
      </mesh>
    </Float>
  );
};

// ── Camera Controller Tied to Window Scroll ──────────────────────────────────
const ScrollCameraController = () => {
  const { camera } = useThree();

  useFrame(() => {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const progress = Math.min(1, Math.max(0, scrollY / maxScroll));

    // Smooth camera drift downward as reader scrolls through the article
    const targetY = -progress * 5.5;
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.08);

    // Slight dynamic perspective tilt
    camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, -progress * 0.15, 0.08);
  });

  return null;
};

// ── Main DynamicScene Canvas ─────────────────────────────────────────────────
const DynamicScene = ({ category = "Technology" }) => {
  const cat = (category || "").toLowerCase();

  const isMusic = cat.includes("music") || cat.includes("audio");
  const isTech =
    cat.includes("tech") ||
    cat.includes("ai") ||
    cat.includes("web3") ||
    cat.includes("robotics");

  return (
    <div
      className="absolute inset-0 w-full h-full -z-10 pointer-events-none bg-[#050714]"
      style={{ width: "100%", height: "100%", position: "fixed", top: 0, left: 0 }}
    >
      <Canvas
        eventSource={typeof document !== "undefined" ? document.getElementById("root") : undefined}
        camera={{ position: [0, 0, 6], fov: 48 }}
        dpr={[1, 2]}
        gl={{ powerPreference: "high-performance", antialias: false, alpha: true, preserveDrawingBuffer: false }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ScrollCameraController />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={1} color="#a855f7" />
        <pointLight position={[-6, 2, 3]} intensity={3} color="#6366f1" />
        <pointLight position={[6, -4, 3]} intensity={3} color="#ec4899" />

        <Sparkles count={180} scale={[14, 14, 10]} size={2.5} speed={0.5} opacity={0.6} />

        {/* Floating Glowing Wireframe Accent Sculpture */}
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <mesh position={[0, 0, -3]} scale={2.5}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color="#818cf8"
              emissive="#4f46e5"
              emissiveIntensity={0.5}
              wireframe={true}
            />
          </mesh>
        </Float>

        {/* Contextual category switch */}
        {isMusic ? (
          <MusicBars />
        ) : isTech ? (
          <TechNodes />
        ) : (
          <DesignRings />
        )}

        <Preload all />
      </Canvas>
    </div>
  );
};

export default DynamicScene;
