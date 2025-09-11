
import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import type { PrimitiveType } from '../types';

// Manually extend JSX.IntrinsicElements to include React Three Fiber's elements.
// This is a workaround for environments where TypeScript's module augmentation may not be working correctly.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface PrimitiveProps {
    primitiveType: PrimitiveType;
    parameters: any;
}

export const Primitive: React.FC<PrimitiveProps> = ({ primitiveType, parameters }) => {
    const geometry = useMemo(() => {
        switch (primitiveType) {
            case 'box':
                return new THREE.BoxGeometry(
                    parameters.width || 1,
                    parameters.height || 1,
                    parameters.depth || 1
                );
            case 'sphere':
                return new THREE.SphereGeometry(
                    parameters.radius || 1,
                    parameters.widthSegments || 32,
                    parameters.heightSegments || 16
                );
            case 'cylinder':
                return new THREE.CylinderGeometry(
                    parameters.radiusTop || 1,
                    parameters.radiusBottom || 1,
                    parameters.height || 1,
                    parameters.radialSegments || 32
                );
            // Add other primitive types here as needed
            default:
                return new THREE.BoxGeometry();
        }
    }, [primitiveType, parameters]);

    return (
        <mesh geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial color="#cccccc" roughness={0.7} metalness={0.1} />
        </mesh>
    );
};
