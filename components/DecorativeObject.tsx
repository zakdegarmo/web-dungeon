import React, { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF, useAnimations } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import { HologramDisplay } from './HologramDisplay';
import type { SceneObjectState } from '../App';

// FIX: Manually extend JSX.IntrinsicElements to include React Three Fiber's elements.
// This is a workaround for environments where TypeScript's module augmentation may not be working correctly.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}


// This sub-component handles the actual model loading and animation.
// It's designed to be wrapped in a Suspense boundary.
const Model: React.FC<Omit<SceneObjectState, 'type' | 'id'> & ThreeElements['group']> = ({ url, ...props }) => {
    // Correct the MIME type for data URLs if necessary.
    let correctedUrl = url;
    if (url && url.startsWith('data:application/octet-stream')) {
        correctedUrl = url.replace('data:application/octet-stream', 'data:model/gltf-binary');
    }
    
    // By placing the ref on the group, we ensure a stable target for the useAnimations hook.
    // The animated model is placed inside this group.
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(correctedUrl);
    const { actions } = useAnimations(animations, group);
    
    // Play the first animation clip found in the model.
    useEffect(() => {
        if (actions) {
            const firstAnimation = Object.keys(actions)[0];
            if (firstAnimation) {
                // reset() is important to start the animation cleanly
                actions[firstAnimation]?.reset().play();
            }
        }
        // Cleanup function to stop animation on component unmount
        return () => {
            if (actions) {
                 const firstAnimation = Object.keys(actions)[0];
                 if (firstAnimation) {
                    actions[firstAnimation]?.stop();
                 }
            }
        }
    }, [actions]);

    // Apply castShadow and receiveShadow to all meshes in the loaded scene
    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [scene]);

    // Use a group with a ref that the useAnimations hook can target.
    // The primitive containing the actual model is placed inside.
    return (
        <group ref={group} {...props} dispose={null}>
            <primitive object={scene} />
        </group>
    );
}


// FIX: Destructure `id` and `url` from props to prevent them from being passed down to underlying R3F components, which causes prop type conflicts.
// The `id` from `SceneObjectState` is for React keys and state management, not for Three.js objects.
// `url` is a custom prop for this component and should be passed explicitly to child components that need it.
// FIX: Omit `id` from `ThreeElements['group']` to resolve the type conflict where `SceneObjectState['id']` can be a string but the R3F `id` prop must be a number.
export const SceneObject: React.FC<SceneObjectState & Omit<ThreeElements['group'], 'id'>> = ({ type, id, url, ...props }) => {
  // The fallback renders a red box if the model fails to load.
  // This Suspense boundary catches errors during model loading.
  return (
    <Suspense fallback={
        <group {...props}>
            <mesh>
                <boxGeometry args={[10, 10, 10]} />
                <meshStandardMaterial color="red" />
            </mesh>
        </group>
    }>
        {type === 'hologram' ? (
            <HologramDisplay url={url} {...props} />
        ) : (
            <Model url={url} {...props} />
        )}
    </Suspense>
  );
};