


import React, { useEffect, useRef, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlayerControlsProps {
    initialPosition: [number, number, number];
    speed?: number;
    rotationSpeed?: number;
}

const useKeyPress = (target: string[]): { [key: string]: boolean } => {
    const [pressedKeys, setPressedKeys] = React.useState<{ [key: string]: boolean }>({});

    const downHandler = ({ key }: KeyboardEvent) => {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            return;
        }
        if (target.includes(key.toLowerCase())) {
            setPressedKeys(prev => ({ ...prev, [key.toLowerCase()]: true }));
        }
    };

    const upHandler = ({ key }: KeyboardEvent) => {
        if (target.includes(key.toLowerCase())) {
            setPressedKeys(prev => ({ ...prev, [key.toLowerCase()]: false }));
        }
    };

    React.useEffect(() => {
        window.addEventListener('keydown', downHandler);
        window.addEventListener('keyup', upHandler);
        return () => {
            window.removeEventListener('keydown', downHandler);
            window.removeEventListener('keyup', upHandler);
        };
    }, []);

    return pressedKeys;
};


export const PlayerControls = ({ initialPosition, speed = 0.5, rotationSpeed = 0.02 }: PlayerControlsProps) => {
    const { camera, scene } = useThree();
    const pivot = useRef(new THREE.Object3D());
    
    const torch = useMemo(() => {
        const light = new THREE.SpotLight(0xffffff, 5, 300, Math.PI / 5, 0.4, 1);
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        return light;
    }, []);

    const keys = useKeyPress(['w', 'a', 's', 'd', 'q', 'e', 'r', 'f', 'z', 'c', 'shift']);

    useEffect(() => {
        pivot.current.position.set(...initialPosition);
        scene.add(pivot.current);
        pivot.current.add(camera);
        camera.position.set(0, 0, 0);
        camera.rotation.set(0, 0, 0);

        // Add the torch to the camera
        camera.add(torch);
        camera.add(torch.target);
        torch.position.set(0, 0, 1);
        torch.target.position.set(0, 0, -1);

        return () => {
            camera.remove(torch.target);
            camera.remove(torch);
            scene.add(camera);
            scene.remove(pivot.current);
        };
    }, [camera, scene, initialPosition, torch]);
    
    useFrame(() => {
        const sprintMultiplier = 2.0;
        const currentSpeed = keys['shift'] ? speed * sprintMultiplier : speed;

        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        const rightVector = new THREE.Vector3().crossVectors(camera.up, direction).normalize();

        if (keys['w']) pivot.current.position.addScaledVector(direction, currentSpeed);
        if (keys['s']) pivot.current.position.addScaledVector(direction, -currentSpeed);
        if (keys['a']) pivot.current.position.addScaledVector(rightVector, currentSpeed);
        if (keys['d']) pivot.current.position.addScaledVector(rightVector, -currentSpeed);

        if (keys['q']) pivot.current.rotation.y += rotationSpeed;
        if (keys['e']) pivot.current.rotation.y -= rotationSpeed;
        
        if (keys['r']) camera.rotation.x = Math.min(Math.PI / 2, camera.rotation.x + rotationSpeed);
        if (keys['f']) camera.rotation.x = Math.max(-Math.PI / 2, camera.rotation.x - rotationSpeed);
        
        if (keys['c']) pivot.current.position.y += currentSpeed;
        if (keys['z']) pivot.current.position.y -= currentSpeed;
    });

    return null;
};