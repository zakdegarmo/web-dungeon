// FIX: Add reference to react-three/fiber types to ensure JSX elements are recognized.
/// <reference types="@react-three/fiber" />
import React, { useRef, useMemo } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import type { Group } from 'three';
// Import ThreeElements to get correct prop types and help TypeScript recognize R3F's JSX elements.
import type { ThreeElements } from '@react-three/fiber';

// Manually extend JSX.IntrinsicElements to include React Three Fiber's elements.
// This is a workaround for environments where TypeScript's module augmentation may not be working correctly.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// An interface can only extend a simple identifier. Changed to a type alias using an intersection to correctly combine with ThreeElements['group'].
// FIX: The component's `id` prop (string | number) conflicts with the underlying `group` element's `id` prop (number).
// Using Omit prevents this conflict by not inheriting the `id` prop from `ThreeElements['group']`.
type ScreenProps = Omit<ThreeElements['group'], 'id'> & {
  id: string | number;
  isHologram?: boolean;
  url?: string;
};

// Removed React.FC and typed props directly to fix JSX intrinsic element errors.
export const Screen = ({ id, isHologram = false, url = '/screen-browser.html', ...props }: ScreenProps) => {
  const group = useRef<Group>(null);
  const { nodes, materials } = useGLTF('/flatScreen.glb');

  const finalUrl = useMemo(() => {
      // If the URL is for our default screen browser, append the screen's ID
      // so the child iframe knows who it is.
      if (url === '/screen-browser.html' || url === 'screen-browser.html') {
          return `${url}?screenId=${id}`;
      }
      return url;
  }, [url, id]);

  return (
    <group ref={group} {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.Cube as any)?.geometry}
        material={(materials.Material as any)}
      >
        <mesh
          geometry={(nodes.Plane as any)?.geometry}
          position={[0, 0, 0.051]} 
        >
          {isHologram ? (
             <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.6} toneMapped={false} />
          ) : (
            <Html
              transform
              occlude
              className="w-[1200px] h-[800px] bg-black select-none"
              position={[0, 0, 0]}
              style={{ pointerEvents: 'auto' }}
            >
              <iframe
                className="w-full h-full"
                src={finalUrl}
                title="Embedded Browser"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </Html>
          )}
        </mesh>
      </mesh>
    </group>
  );
};

useGLTF.preload('/flatScreen.glb');