/// <reference types="@react-three/fiber" />
import React, { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import type { DoorState } from '../App';

// Manually extend JSX.IntrinsicElements to include React Three Fiber's elements.
// This is a workaround for environments where TypeScript's module augmentation may not be working correctly.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// This file now exports a single Door component.
// The old Doors wrapper and Arrangement types have been removed.

export { type DoorState };

// Re-defining DoorData for clarity within this component's scope
export interface DoorData {
    id: string;
    link: string;
    type: 'portal' | 'file' | 'pathway';
}


type DoorProps = ThreeElements['group'] & {
    data: DoorState;
    isHologram?: boolean;
};

const Door = ({ data, isHologram = false, ...props }: DoorProps) => {
    const { scene } = useGLTF('/door.glb');
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    // A single, standardized material for all doors.
    const doorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: 0x8B4513, // SaddleBrown
        metalness: 0.1,
        roughness: 0.8,
        emissive: 0x4a250a, // Darker brown emissive
        emissiveIntensity: 0.7,
    }), []);

    useEffect(() => {
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                (child as THREE.Mesh).material = doorMaterial;
            }
        });
    }, [clonedScene, doorMaterial]);

    const handleDoorClick = (e: any) => {
        e.stopPropagation();
        if (isHologram) return; // Disable clicks for holograms
        if (data.url) {
            // Open the link in a new tab for a better user experience.
            window.open(data.url, '_blank', 'noopener,noreferrer');
        }
    };
    
    // The component now directly applies transform properties from its data.
    return (
        <primitive 
            object={clonedScene} 
            onClick={handleDoorClick} 
            position={data.position}
            rotation={data.rotation}
            scale={data.scale}
            {...props}
        />
    );
};

export default Door;

useGLTF.preload('/door.glb');