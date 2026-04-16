import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

function Particles({ count = 90 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 10 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    camera.position.x = Math.sin(t * 0.07) * 3.2;
    camera.position.y = Math.cos(t * 0.05) * 1.6;
    camera.position.z = 18 + Math.sin(t * 0.03) * 0.8;
    camera.lookAt(0, 0, 0);
    if (points.current) {
      points.current.rotation.y = t * 0.02;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#00ff88"
        size={0.07}
        transparent
        opacity={0.85}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function Orbs() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (group.current) {
      group.current.children.forEach((child, i) => {
        child.position.y = Math.sin(t * 0.8 + i) * 0.6;
      });
    }
  });
  const orbs = useMemo(
    () =>
      [
        { color: "#ffd700", pos: [6, 2, -4] as const, s: 0.55 },
        { color: "#00ccff", pos: [-7, -1, -2] as const, s: 0.45 },
        { color: "#00ff88", pos: [2, -4, 2] as const, s: 0.35 },
      ] as const,
    [],
  );
  return (
    <group ref={group}>
      {orbs.map((o) => (
        <mesh key={o.color} position={o.pos}>
          <sphereGeometry args={[o.s, 24, 24]} />
          <meshStandardMaterial
            color={o.color}
            emissive={o.color}
            emissiveIntensity={0.9}
            metalness={0.2}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#050508"]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 10, 6]} intensity={1.1} color="#ffffff" />
      <Particles />
      <Orbs />
    </>
  );
}

export function NetworkBackground() {
  const [ok, setOk] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px), (prefers-reduced-motion: reduce)");
    const update = () => setOk(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!ok) {
    return (
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,136,0.12),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,215,0,0.08),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(0,204,255,0.1),transparent_45%)]"
        aria-hidden
      />
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 18], fov: 55 }} dpr={[1, 1.75]} gl={{ alpha: true, antialias: true }}>
        <Scene />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void/10 via-void/40 to-void" />
    </div>
  );
}
