/// <reference types="@react-three/fiber" />
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Mesh, MeshStandardMaterial } from 'three';
import type { ThreeElements } from '@react-three/fiber';

// Manually extend JSX.IntrinsicElements to include React Three Fiber's elements.
// This is a workaround for environments where TypeScript's module augmentation may not be working correctly.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

type HubProps = ThreeElements['mesh'] & {
    onToggleManager: () => void;
};

export const Hub = ({ onToggleManager, ...props }: HubProps) => {
    const hubRef = useRef<Mesh>(null);
    const { camera } = useThree();
    
    const handleHubClick = (e: any) => {
        e.stopPropagation();
        onToggleManager();
    };

    useFrame((state) => {
        if (hubRef.current) {
            // Make the hub always face the camera
            hubRef.current.lookAt(camera.position);

            // Add a subtle pulsing animation to the emissive intensity
            const material = hubRef.current.material as MeshStandardMaterial;
            if(material.emissive) {
                 material.emissiveIntensity = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.25;
            }
        }
    });

    return (
        <mesh ref={hubRef} {...props} onClick={handleHubClick} castShadow>
            <sphereGeometry args={[9, 32, 32]} />
            <meshStandardMaterial 
                color={0xff2244} 
                emissive={0xff2244}
                emissiveIntensity={1} // Start intensity
                roughness={0.4}
                toneMapped={false}
            />
        </mesh>
    );
};