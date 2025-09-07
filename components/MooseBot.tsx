

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import type { ThreeElements } from '@react-three/fiber';
import type { MooseBotState } from '../App';

// FIX: Manually extend JSX.IntrinsicElements to include React Three Fiber's elements.
// This is a workaround for environments where TypeScript's module augmentation may not be working correctly.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

type MooseBotProps = MooseBotState & ThreeElements['group'] & {
    onAnimationsLoaded: (names: string[]) => void;
};

export const MooseBot: React.FC<MooseBotProps> = ({ url, dialogue, activeAnimation, onAnimationsLoaded, ...props }) => {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(url);
    const { actions, names } = useAnimations(animations, group);
    const { camera } = useThree();

    // Report available animations to parent
    useEffect(() => {
        if (names && names.length) {
            onAnimationsLoaded(names);
        }
    }, [names, onAnimationsLoaded]);
    
    // Control animations
    useEffect(() => {
        // Reset and fade in the new animation
        actions[activeAnimation]?.reset().fadeIn(0.5).play();
        // Fade out and stop the old animation
        return () => {
            actions[activeAnimation]?.fadeOut(0.5);
        }
    }, [actions, activeAnimation]);

    // Apply castShadow and receiveShadow to all meshes
    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [scene]);

    // Make the bot turn to face the camera smoothly
    useFrame(() => {
        if (group.current) {
            const targetPosition = new THREE.Vector3(camera.position.x, group.current.position.y, camera.position.z);
            
            const targetQuaternion = new THREE.Quaternion();
            const tempMatrix = new THREE.Matrix4();
            tempMatrix.lookAt(group.current.position, targetPosition, group.current.up);
            targetQuaternion.setFromRotationMatrix(tempMatrix);
            
            // Smoothly interpolate the rotation
            group.current.quaternion.slerp(targetQuaternion, 0.05);
        }
    });

    // Use a group with a ref that the useAnimations hook can target.
    return (
        <group ref={group} {...props} dispose={null}>
            <primitive object={scene} />
            {dialogue && (
                 <Html position={[0, 12, 0]} center wrapperClass="w-64">
                    <div className="relative filter drop-shadow-lg">
                        <div 
                            className="bg-white text-black text-sm rounded-xl p-3 text-center"
                            style={{ fontFamily: "'Comic Sans MS', 'Comic Neue', cursive" }}
                        >
                            {dialogue}
                        </div>
                        <div 
                            className="absolute left-1/2"
                            style={{
                                width: 0,
                                height: 0,
                                borderLeft: '10px solid transparent',
                                borderRight: '10px solid transparent',
                                borderTop: '10px solid white',
                                bottom: '-10px',
                                transform: 'translateX(-50%)'
                            }}
                        ></div>
                    </div>
                </Html>
            )}
        </group>
    );
}

// Preload the default model for faster initial load
useGLTF.preload('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb');