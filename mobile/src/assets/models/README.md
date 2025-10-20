# 3D Avatar Models Directory

This directory will contain GLTF/GLB 3D avatar models for Three.js rendering in the Gym-Mate mobile app.

## Model Requirements

### Format
- **File Format**: GLTF 2.0 or GLB (binary GLTF)
- **Compression**: Draco compression recommended for smaller file sizes
- **File Size**: Target under 5MB per model for mobile performance

### Rig Requirements
- **Skeleton**: Humanoid skeleton with standard bone names for animation retargeting (Phase 2B)
- **Bone Structure**: Standard T-pose or A-pose
- **Root Bone**: Single root bone at origin (0, 0, 0)

### Morph Targets (Blend Shapes)
Models should include morph targets for muscle group visualization:
- `muscle_chest`: Chest muscle development (0-1 range)
- `muscle_back`: Back muscle development (0-1 range)
- `muscle_legs`: Leg muscle development (0-1 range)
- `muscle_shoulders`: Shoulder muscle development (0-1 range)
- `muscle_arms`: Arm muscle development (0-1 range)
- `muscle_core`: Core muscle development (0-1 range)

These morph targets should map to the MuscleGroups interface values (1-10) scaled to 0-1 range.

### Materials
Named materials for runtime customization:
- `material_skin`: Base skin material (for skin tone changes)
- `material_hair`: Hair material (for hair color changes)
- `material_clothing_top`: Upper body clothing
- `material_clothing_bottom`: Lower body clothing

### Optimization Guidelines
- **Triangle Count**: 5,000-10,000 triangles for mobile optimization
- **Texture Resolution**: Maximum 1024x1024 pixels
- **Texture Format**: JPG for diffuse, PNG for transparency
- **Draw Calls**: Minimize material count (target 3-5 materials)
- **Vertex Count**: Keep under 15,000 vertices

## Model Sources

### Ready Player Me (Recommended)
- **API Integration**: Generate avatars programmatically from avatarConfig
- **URL**: https://readyplayer.me
- **Format**: GLB export with morph targets
- **License**: Free for non-commercial use

### Mixamo
- **URL**: https://www.mixamo.com
- **Format**: FBX (convert to GLTF using Blender)
- **Rigging**: Auto-rigging available
- **License**: Free with Adobe account

### Sketchfab
- **URL**: https://sketchfab.com
- **Format**: Various (check GLTF availability)
- **License**: Varies (check individual model licenses)
- **Filter**: Search for "low poly human" or "stylized character"

### Custom Modeling (Blender)
- **Software**: Blender 3.0+ (free, open-source)
- **Export**: Use built-in GLTF exporter
- **Rigging**: Use Rigify addon for standard humanoid rig
- **Morph Targets**: Shape keys in Blender = morph targets in GLTF

## Phase 2A Status

**Current Implementation**: ThreeAvatarView component uses a placeholder box geometry.

**Next Steps (Phase 2B)**:
1. Integrate actual GLTF model
2. Implement morph target control based on MuscleGroups
3. Add material customization for avatarConfig
4. Implement animation retargeting for exercise movements

## File Structure (Future)

```
models/
├── README.md (this file)
├── avatar_base.glb         # Base avatar model
├── avatar_male.glb         # Male variant
├── avatar_female.glb       # Female variant
└── textures/              # Shared textures
    ├── skin_tones/        # Skin tone texture variants
    ├── hair_colors/       # Hair color texture variants
    └── clothing/          # Clothing texture variants
```

## Integration Notes

### Loading in ThreeAvatarView
```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Replace placeholder with:
const gltf = useLoader(GLTFLoader, '/assets/models/avatar_base.glb');
```

### Applying Morph Targets
```typescript
// Map MuscleGroups (1-10) to morph target influence (0-1)
mesh.morphTargetInfluences[0] = (muscleGroups.chest - 1) / 9;
mesh.morphTargetInfluences[1] = (muscleGroups.back - 1) / 9;
// ... etc
```

### Material Customization
```typescript
// Apply skin tone
const skinMaterial = mesh.material.find(m => m.name === 'material_skin');
if (skinMaterial && avatarConfig.skinTone) {
  skinMaterial.color = new THREE.Color(avatarConfig.skinTone);
}
```

## Performance Considerations

- **LOD (Level of Detail)**: Prepare 3 quality levels (low/medium/high) for different devices
- **Texture Atlas**: Combine multiple textures into single atlas to reduce draw calls
- **Instancing**: Use instanced rendering if showing multiple avatars
- **Culling**: Implement frustum culling for off-screen avatars

## Testing Checklist

Before integrating a new model:
- [ ] Model loads without errors in Three.js
- [ ] All required morph targets present
- [ ] Materials properly named
- [ ] File size under 5MB
- [ ] Renders at 30+ FPS on target devices
- [ ] Morph targets respond correctly to muscle values
- [ ] Materials accept color changes
- [ ] No z-fighting or rendering artifacts
- [ ] Proper normals (no black faces)
