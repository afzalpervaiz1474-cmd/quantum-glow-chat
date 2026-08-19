import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Icosahedron, Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type SceneMode = "idle" | "thinking" | "streaming";

const PALETTE: Record<SceneMode, { core: string; halo: string; particles: string; speed: number }> =
  {
    idle: { core: "#43e0f8", halo: "#7a6bff", particles: "#8fe8ff", speed: 0.12 },
    thinking: { core: "#c266ff", halo: "#ff6ad5", particles: "#e2a8ff", speed: 0.85 },
    streaming: { core: "#4dffd0", halo: "#43e0f8", particles: "#9dfff0", speed: 0.45 },
  };

/** Cursor-driven parallax applied to the whole scene group. */
function useParallax(strength = 0.35) {
  const target = useRef(new THREE.Vector2());
  const { size } = useThree();

  useFrame((state) => {
    target.current.set(
      (state.pointer.x || 0) * strength,
      (state.pointer.y || 0) * strength * (size.height / Math.max(size.width, 1)) * 1.6,
    );
  });

  return target;
}

function QuantumCore({ mode }: { mode: SceneMode }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const parallax = useParallax();
  const palette = PALETTE[mode];

  const coreColor = useMemo(() => new THREE.Color(palette.core), [palette.core]);
  const haloColor = useMemo(() => new THREE.Color(palette.halo), [palette.halo]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y += delta * palette.speed;
      group.current.rotation.x = Math.sin(t * 0.2) * 0.15;
      group.current.position.x += (parallax.current.x * 1.6 - group.current.position.x) * 0.05;
      group.current.position.y += (parallax.current.y * 1.6 - group.current.position.y) * 0.05;
    }

    const pulse = mode === "idle" ? 0.03 : mode === "streaming" ? 0.09 : 0.16;
    const scale = 1 + Math.sin(t * (mode === "thinking" ? 5 : 2)) * pulse;

    if (core.current) {
      core.current.scale.setScalar(scale);
      const mat = core.current.material as THREE.MeshStandardMaterial;
      mat.color.lerp(coreColor, 0.06);
      mat.emissive.lerp(coreColor, 0.06);
      mat.emissiveIntensity = mode === "thinking" ? 1.9 : 1.1;
    }

    if (halo.current) {
      halo.current.rotation.z -= delta * palette.speed * 1.6;
      halo.current.scale.setScalar(1.55 + Math.sin(t * 1.4) * pulse * 1.4);
      const mat = halo.current.material as THREE.MeshBasicMaterial;
      mat.color.lerp(haloColor, 0.06);
    }
  });

  return (
    <group ref={group}>
      <Float speed={1.4} rotationIntensity={0.5} floatIntensity={0.9}>
        <Icosahedron ref={core} args={[1.35, 4]}>
          <meshStandardMaterial
            color={palette.core}
            emissive={palette.core}
            emissiveIntensity={1.2}
            roughness={0.15}
            metalness={0.6}
            wireframe
          />
        </Icosahedron>

        <Icosahedron ref={halo} args={[1.35, 1]}>
          <meshBasicMaterial color={palette.halo} wireframe transparent opacity={0.22} />
        </Icosahedron>

        <mesh>
          <sphereGeometry args={[0.72, 48, 48]} />
          <meshStandardMaterial
            color={palette.halo}
            emissive={palette.halo}
            emissiveIntensity={mode === "idle" ? 0.8 : 1.6}
            transparent
            opacity={0.35}
          />
        </mesh>
      </Float>

      <Sparkles
        count={mode === "idle" ? 220 : 420}
        scale={[14, 9, 10]}
        size={mode === "thinking" ? 5 : 3.2}
        speed={mode === "idle" ? 0.25 : 1.1}
        opacity={0.75}
        color={palette.particles}
      />
    </group>
  );
}

function ParticleField({ mode }: { mode: SceneMode }) {
  const points = useRef<THREE.Points>(null);
  const palette = PALETTE[mode];

  const positions = useMemo(() => {
    const count = 1400;
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 6 + Math.random() * 9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      array[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      array[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
      array[i * 3 + 2] = radius * Math.cos(phi);
    }
    return array;
  }, []);

  useFrame((state, delta) => {
    if (!points.current) return;
    points.current.rotation.y += delta * palette.speed * 0.3;
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        sizeAttenuation
        color={palette.particles}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

export function QuantumScene({ mode }: { mode: SceneMode }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0, 0, 6.5], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#080b18"]} />
        <fog attach="fog" args={["#080b18", 8, 22]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 4, 6]} intensity={2.4} color={PALETTE[mode].core} />
        <pointLight position={[-5, -3, -4]} intensity={1.8} color={PALETTE[mode].halo} />
        <QuantumCore mode={mode} />
        <ParticleField mode={mode} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/40 to-background/85" />
    </div>
  );
}
