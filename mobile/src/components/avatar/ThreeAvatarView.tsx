import React, { useState, useEffect, useRef, Suspense } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { Canvas, useFrame, useLoader } from '@react-three/fiber/native';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import { AvatarConfig, MuscleGroups } from '../../types/models';
import { SPACING } from '../../utils/constants';

/**
 * Props for the ThreeAvatarView component
 */
interface ThreeAvatarViewProps {
  /** Avatar customization configuration */
  avatarConfig?: AvatarConfig;
  /** Muscle group development levels */
  muscleGroups: MuscleGroups;
  /** Size of the avatar display in pixels */
  size?: number;
  /** Camera viewing angle */
  cameraAngle?: 'front' | 'side' | 'three-quarter';
}

/**
 * Inner 3D model component that handles GLTF loading and animations.
 * 
 * GLTF Model Requirements:
 * - Humanoid rig with standard bone names
 * - Morph targets for muscle groups (chest, back, legs, shoulders, arms, core)
 * - Named materials for customization (skin, hair, clothing)
 */
const AvatarModel: React.FC<{
  avatarConfig?: AvatarConfig;
  muscleGroups: MuscleGroups;
}> = ({ avatarConfig, muscleGroups }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Placeholder GLTF path - will be replaced with actual model in Phase 2B
  // For now, we'll use a basic box as placeholder
  // const gltf = useLoader(GLTFLoader, '/assets/models/avatar.glb');
  
  // Rotation animation using useFrame
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  // Apply muscle group morphing
  useEffect(() => {
    if (meshRef.current) {
      // In Phase 2B, this will apply morph targets based on muscleGroups
      // For now, scale the mesh based on overall muscle development
      const avgMuscle = Object.values(muscleGroups).reduce((a, b) => a + b, 0) / 6;
      const scale = 0.8 + (avgMuscle / 10) * 0.4; // Scale from 0.8 to 1.2
      meshRef.current.scale.set(scale, scale, scale);
    }
  }, [muscleGroups]);

  // Apply avatar customization
  useEffect(() => {
    if (meshRef.current && avatarConfig) {
      // In Phase 2B, this will apply material colors and texture swaps
      // For now, apply basic color to the mesh material
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (avatarConfig.skinTone) {
        material.color = new THREE.Color(avatarConfig.skinTone);
      }
    }
  }, [avatarConfig]);

  // Placeholder geometry - will be replaced with GLTF model
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[1, 2, 0.5]} />
      <meshStandardMaterial color={avatarConfig?.skinTone || '#f5deb3'} />
    </mesh>
  );
};

/**
 * Three.js-based 3D avatar component.
 * This is a foundation component for 3D rendering; actual model integration happens in Phase 2B.
 */
const ThreeAvatarView: React.FC<ThreeAvatarViewProps> = ({
  avatarConfig,
  muscleGroups,
  size = 200,
  cameraAngle = 'front',
}) => {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);

  // Calculate camera position based on angle
  const getCameraPosition = (): [number, number, number] => {
    switch (cameraAngle) {
      case 'side':
        return [5, 0, 0];
      case 'three-quarter':
        return [3, 1, 3];
      case 'front':
      default:
        return [0, 0, 5];
    }
  };

  if (error) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={{ color: theme.colors.error }}>
          Failed to load 3D model
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas
        camera={{
          position: getCameraPosition(),
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        onCreated={(state) => {
          // Set up WebGL context
          state.gl.setClearColor(theme.colors.background, 0);
        }}
        style={{ flex: 1 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        
        <Suspense
          fallback={null}
        >
          <AvatarModel
            avatarConfig={avatarConfig}
            muscleGroups={muscleGroups}
          />
        </Suspense>
      </Canvas>
      
      {/* Loading overlay while model loads */}
      <Suspense
        fallback={
          <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        }
      >
        {/* This empty fragment ensures the loading indicator shows during Suspense */}
        <></>
      </Suspense>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default ThreeAvatarView;
