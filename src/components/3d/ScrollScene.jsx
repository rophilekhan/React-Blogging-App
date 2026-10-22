import React, { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Float, Text, Sparkles, MeshDistortMaterial, Preload } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Camera Controller hooked to GSAP ScrollTrigger ──────────────────────────
const CameraController = () => {
  const { camera } = useThree();

  useEffect(() => {
    // Initial camera position
    camera.position.set(0, 0, 7);
    camera.rotation.set(0, 0, 0);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#landing-scroll-container",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
        },
      });

      // Phase 1 -> 2: Descend toward features section
      tl.to(
        camera.position,
        {
          x: 0.8,
          y: -7.5,
          z: 5.5,
          ease: "power1.inOut",
        },
        0
      );

      tl.to(
        camera.rotation,
        {
          x: -0.12,
          y: 0.18,
          z: 0.02,
          ease: "power1.inOut",
        },
        0
      );

      // Phase 2 -> 3: Descend toward CTA wireframe globe
      tl.to(
        camera.position,
        {
          x: 0,
          y: -16,
          z: 5,
          ease: "power1.inOut",
        },
        1
      );

      tl.to(
        camera.rotation,
        {
          x: 0.08,
          y: 0,
          z: 0,
          ease: "power1.inOut",
        },
        1
      );
    });

    return () => {
      ctx.revert();
    };
  }, [camera]);

  return null;
};

// ─── Section 1: Hero 3D Title & Rings ─────────────────────────────────────────
const HeroElements = () => {
  const ringRef = useRef();

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.2;
      ringRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group position={[0, 0.5, 0]}>
      {/* 3D Title */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
        <Text
          fontSize={1.3}
          letterSpacing={0.12}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#6366f1"
        >
          SYNTHSCROLL
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.9}
            roughness={0.1}
          />
        </Text>
      </Float>

      {/* Orbiting Ring */}
      <mesh ref={ringRef} position={[0, 0, -0.5]}>
        <torusGeometry args={[2.8, 0.03, 16, 100]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#7c3aed"
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
};

// ─── Section 2: Floating Geometric Sculptures ────────────────────────────────
const FeatureElements = () => {
  const torusKnotRef = useRef();
  const icosaRef = useRef();

  useFrame((_, delta) => {
    if (torusKnotRef.current) {
      torusKnotRef.current.rotation.x += delta * 0.4;
      torusKnotRef.current.rotation.y += delta * 0.2;
    }
    if (icosaRef.current) {
      icosaRef.current.rotation.y -= delta * 0.3;
      icosaRef.current.rotation.z += delta * 0.25;
    }
  });

  return (
    <group position={[0, -7.5, 0]}>
      {/* Distorted Torus Knot on Right */}
      <Float speed={2.5} rotationIntensity={1} floatIntensity={1.5}>
        <mesh ref={torusKnotRef} position={[2.8, 0, -1]} scale={0.75}>
          <torusKnotGeometry args={[1, 0.3, 100, 16]} />
          <MeshDistortMaterial
            color="#ec4899"
            distort={0.4}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </Float>

      {/* Wireframe Icosahedron on Left */}
      <Float speed={2} rotationIntensity={1.2} floatIntensity={1.2}>
        <mesh ref={icosaRef} position={[-2.8, 0.2, -0.5]} scale={1.1}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color="#06b6d4"
            wireframe
            roughness={0.3}
            metalness={0.9}
          />
        </mesh>
      </Float>
    </group>
  );
};

// ─── Section 3: Wireframe Globe & Energy Core ─────────────────────────────────
const GlobeCTA = () => {
  const globeRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();

  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.25;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x += delta * 0.2;
      ring2Ref.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group position={[0, -16, 0]}>
      {/* Outer Wireframe Globe */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[2.2, 28, 28]} />
        <meshStandardMaterial
          color="#818cf8"
          wireframe
          emissive="#4338ca"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Inner Glowing Core */}
      <mesh>
        <sphereGeometry args={[1.5, 24, 24]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.3} />
      </mesh>

      {/* Orbiting Energy Rings */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[3, 0.03, 16, 100]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.8}
        />
      </mesh>

      <mesh ref={ring2Ref} rotation={[-Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[3.4, 0.02, 16, 100]} />
        <meshStandardMaterial
          color="#f43f5e"
          emissive="#e11d48"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
};

// ─── Main 3D Scroll Scene ─────────────────────────────────────────────────────
const ScrollScene = () => {
  return (
    <>
      <CameraController />

      {/* Global Lighting */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
      <pointLight position={[-8, 2, 4]} intensity={3} color="#6366f1" />
      <pointLight position={[8, -8, 4]} intensity={3} color="#ec4899" />
      <pointLight position={[0, -16, 6]} intensity={3} color="#06b6d4" />

      {/* Starry Dust */}
      <Sparkles count={250} scale={[12, 25, 10]} size={2.5} speed={0.4} opacity={0.6} />

      {/* 3D Scene Stages */}
      <HeroElements />
      <FeatureElements />
      <GlobeCTA />

      {/* Pre-compile all shaders and geometries into GPU memory */}
      <Preload all />
    </>
  );
};

export default ScrollScene;
