import React, { useEffect, useRef, Suspense } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Canvas, useFrame, useLoader } from '@react-three/fiber/native';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import { AvatarConfig, Avatar3DConfig, MuscleGroups } from '../../types/models';

/**
 * Props for the ThreeAvatarView component
 */
interface ThreeAvatarViewProps {
  /** Avatar customization configuration (accepts Avatar3DConfig for modelUrl) */
  avatarConfig?: AvatarConfig | Avatar3DConfig;
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
/**
 * GLTF Model component that loads and displays the 3D avatar model.
 * Falls back to placeholder geometry if modelUrl is not provided.
 */
const GLTFModel: React.FC<{
  modelUrl: string;
  avatarConfig?: AvatarConfig | Avatar3DConfig;
  muscleGroups: MuscleGroups;
}> = ({ modelUrl, avatarConfig, muscleGroups }) => {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const modelRef = useRef<THREE.Group>(null);

  // Rotation animation
  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.3;
    }
  });

  // Apply muscle group morphing
  useEffect(() => {
    if (modelRef.current) {
      // Apply morph targets if available
      modelRef.current.traverse((child) => {
        if ((child as any).isMesh && (child as any).morphTargetDictionary) {
          const mesh = child as THREE.Mesh;
          // Apply muscle group morphs if they exist
          Object.entries(muscleGroups).forEach(([muscle, level]) => {
            const morphIndex = (mesh as any).morphTargetDictionary[muscle];
            if (morphIndex !== undefined && mesh.morphTargetInfluences) {
              mesh.morphTargetInfluences[morphIndex] = level / 10;
            }
          });
        }
      });

      // Also apply overall scale based on muscle development
      const avgMuscle = Object.values(muscleGroups).reduce((a, b) => a + b, 0) / 6;
      const scale = 0.9 + (avgMuscle / 10) * 0.2;
      modelRef.current.scale.set(scale, scale, scale);
    }
  }, [muscleGroups]);

  // Apply avatar customization
  useEffect(() => {
    if (modelRef.current && avatarConfig) {
      modelRef.current.traverse((child) => {
        if ((child as any).isMesh) {
          const mesh = child as THREE.Mesh;
          const material = mesh.material as THREE.MeshStandardMaterial;
          
          // Apply skin tone to skin materials
          if (material.name === 'skin' && avatarConfig.skinTone) {
            material.color = new THREE.Color(avatarConfig.skinTone);
          }
          
          // Apply hair color to hair materials
          if (material.name === 'hair' && avatarConfig.hairColor) {
            material.color = new THREE.Color(avatarConfig.hairColor);
          }
          
          // Apply clothing color to clothing materials
          if (material.name === 'clothing' && avatarConfig.clothingColor) {
            material.color = new THREE.Color(avatarConfig.clothingColor);
          }
        }
      });
    }
  }, [avatarConfig]);

  return <primitive ref={modelRef} object={gltf.scene} position={[0, 0, 0]} />;
};

/**
 * Fallback placeholder model component used when no GLTF model is available.
 */
const PlaceholderModel: React.FC<{
  avatarConfig?: AvatarConfig | Avatar3DConfig;
  muscleGroups: MuscleGroups;
}> = ({ avatarConfig, muscleGroups }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Rotation animation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  // Apply muscle group scaling
  useEffect(() => {
    if (meshRef.current) {
      const avgMuscle = Object.values(muscleGroups).reduce((a, b) => a + b, 0) / 6;
      const scale = 0.8 + (avgMuscle / 10) * 0.4;
      meshRef.current.scale.set(scale, scale, scale);
    }
  }, [muscleGroups]);

  // Apply avatar customization
  useEffect(() => {
    if (meshRef.current && avatarConfig) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (avatarConfig.skinTone) {
        material.color = new THREE.Color(avatarConfig.skinTone);
      }
    }
  }, [avatarConfig]);

  // Basic box geometry as placeholder
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[1, 2, 0.5]} />
      <meshStandardMaterial color={avatarConfig?.skinTone || '#f5deb3'} />
    </mesh>
  );
};

/**
 * Inner 3D model component that handles GLTF loading and animations.
 * Falls back to placeholder when no modelUrl is provided.
 */
const AvatarModel: React.FC<{
  avatarConfig?: AvatarConfig | Avatar3DConfig;
  muscleGroups: MuscleGroups;
}> = ({ avatarConfig, muscleGroups }) => {
  // Check if we have a 3D model URL
  const modelUrl = (avatarConfig as Avatar3DConfig)?.modelUrl;

  if (modelUrl) {
    // Load GLTF model with Suspense boundary
    return (
      <Suspense fallback={<PlaceholderModel avatarConfig={avatarConfig} muscleGroups={muscleGroups} />}>
        <GLTFModel modelUrl={modelUrl} avatarConfig={avatarConfig} muscleGroups={muscleGroups} />
      </Suspense>
    );
  }

  // Use placeholder if no model URL
  return <PlaceholderModel avatarConfig={avatarConfig} muscleGroups={muscleGroups} />;
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
        
        <AvatarModel
          avatarConfig={avatarConfig}
          muscleGroups={muscleGroups}
        />
      </Canvas>
      
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
