import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, MeshDistortMaterial, Sphere } from '@react-three/drei'
import * as THREE from 'three'

const FlowerPetals = ({ color, count = 8 }) => {
  const groupRef = useRef()
  const petalsRef = useRef([])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // Rotate the entire flower slowly
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.2
    }

    // Animate individual petals
    petalsRef.current.forEach((petal, i) => {
      if (petal) {
        const offset = (i / count) * Math.PI * 2
        petal.position.y = Math.sin(time * 2 + offset) * 0.1
        petal.rotation.z = Math.sin(time + offset) * 0.1
      }
    })
  })

  const petalPositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const radius = 1.2
      positions.push({
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius,
        rotation: angle,
      })
    }
    return positions
  }, [count])

  return (
    <group ref={groupRef}>
      {/* Center of flower */}
      <Sphere args={[0.3, 32, 32]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#FFD700"
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.4}
        />
      </Sphere>

      {/* Petals */}
      {petalPositions.map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => (petalsRef.current[i] = el)}
          position={[pos.x, pos.y, pos.z]}
          rotation={[0, 0, pos.rotation]}
        >
          <sphereGeometry args={[0.6, 32, 32]} />
          <MeshDistortMaterial
            color={color}
            attach="material"
            distort={0.4}
            speed={3}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  )
}

const FlowerBloom = ({ flower }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff69b4" />

      <FlowerPetals color={flower.color} count={8} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={1}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2}
      />
    </Canvas>
  )
}

export default FlowerBloom
