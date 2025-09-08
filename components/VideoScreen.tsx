import React from 'react';
import { useVideoTexture } from '@react-three/drei';
// The `MeshProps` type is not reliably exported from '@react-three/fiber'. The recommended approach is to use `ThreeElements['mesh']` for mesh component props.
import type { ThreeElements } from '@react-three/fiber';

// Manually extend JSX.IntrinsicElements to include React Three Fiber's elements.
// This is a workaround for environments where TypeScript's module augmentation may not be working correctly.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// Removed React.FC and typed props directly to fix JSX intrinsic element errors.
export const VideoScreen = (props: ThreeElements['mesh']) => {
  // IMPORTANT: You must place your 'background_video.mp4' file in the '/public' directory.
  const texture = useVideoTexture('/background_video.mp4');
  
  return (
    <mesh {...props} scale={[4, 2.25, 1]} castShadow receiveShadow>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial map={texture} toneMapped={false} emissive={[0.5, 0.5, 0.5]} emissiveMap={texture} />
    </mesh>
  );
};