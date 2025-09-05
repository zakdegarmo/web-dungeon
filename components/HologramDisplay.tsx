
import React, { useState, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { Screen } from './Screen';
import Door from './Doors';
import { SceneObject } from './DecorativeObject'; 
import type { ScreenState, DoorState, SceneObjectState, RoomConfig } from '../App';

interface SceneConfig {
    screens?: ScreenState[];
    doors?: DoorState[];
    sceneObjects?: SceneObjectState[];
    room?: RoomConfig;
}

type HologramDisplayProps = ThreeElements['group'] & {
    url: string;
};

const Pedestal = (props: ThreeElements['group']) => {
    return (
        <group {...props}>
            <mesh position={[0, -0.25, 0]}>
                <cylinderGeometry args={[15, 16, 0.5, 64]} />
                <meshStandardMaterial 
                    color="#00ffff" 
                    emissive="#00ffff" 
                    emissiveIntensity={0.3} 
                    transparent 
                    opacity={0.3} 
                />
            </mesh>
            <mesh>
                 <cylinderGeometry args={[14.5, 14.5, 0.2, 64]} />
                 <meshStandardMaterial 
                    color="#ffffff" 
                    emissive="#ffffff" 
                    emissiveIntensity={1}
                    toneMapped={false}
                />
            </mesh>
        </group>
    )
}

export const HologramDisplay: React.FC<HologramDisplayProps> = ({ url, ...props }) => {
    const [sceneData, setSceneData] = useState<SceneConfig | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!url) {
            setError("No URL provided for scene configuration.");
            return;
        };

        const fetchSceneData = async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: SceneConfig = await response.json();
                
                // Validate data structure
                if (!data.screens && !data.doors && !data.sceneObjects && !data.room) {
                    throw new Error("Invalid or empty configuration file.");
                }

                setSceneData(data);
                setError(null);
            } catch (e: any) {
                console.error("Failed to fetch or parse scene data:", e);
                setError(e.message);
                setSceneData(null);
            }
        };

        fetchSceneData();
    }, [url]);

    if (error) {
        return (
            <group {...props}>
                <Pedestal />
                <mesh position={[0, 10, 0]}>
                    <boxGeometry args={[5, 5, 5]} />
                    <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
                </mesh>
            </group>
        );
    }
    
    if (!sceneData) {
        return (
             <group {...props}>
                <Pedestal />
                <mesh position={[0, 10, 0]}>
                    <boxGeometry args={[5, 5, 5]} />
                    <meshStandardMaterial color="blue" wireframe />
                </mesh>
            </group>
        )
    }

    // Scale down the entire scene content to fit as a miniature
    const HOLOGRAM_SCALE = 0.1;

    return (
        <group {...props}>
            <Pedestal position={[0,5,0]}/>
            <group scale={HOLOGRAM_SCALE} position={[0, 10, 0]}>
                {sceneData.screens?.map(screen => (
                    screen.isVisible && (
                        <Screen
                            key={`hologram-screen-${screen.id}`}
                            url={screen.url}
                            position={screen.position}
                            rotation={screen.rotation}
                            scale={screen.scale}
                            isHologram={true}
                        />
                    )
                ))}
                {sceneData.doors?.map(door => (
                    <Door 
                        key={`hologram-door-${door.id}`} 
                        data={door} 
                        isHologram={true}
                    />
                ))}
                {sceneData.sceneObjects?.map(obj => (
                    // Use Suspense here for nested models that need to load
                    <Suspense key={`hologram-object-${obj.id}`} fallback={null}>
                       <SceneObject {...obj} />
                    </Suspense>
                ))}
            </group>
        </group>
    );
};