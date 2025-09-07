

import React, { Suspense, memo } from 'react';
// FIX: Add `type ThreeElements` to import to manually extend JSX namespace for R3F components
import { Canvas, type ThreeElements } from '@react-three/fiber';
import { Screen } from './Screen';
import { Loader } from './Loader';
import Door from './Doors';
import { SceneObject } from './DecorativeObject';
import { Hub } from './Hub';
import { PlayerControls } from './PlayerControls';
import { MooseBot } from './MooseBot';
import * as THREE from 'three';
import type { ScreenState, DoorState, SceneObjectState, MooseBotState, RoomConfig } from '../App';

// FIX: Manually extend JSX.IntrinsicElements to include React Three Fiber's elements.
// This is a workaround for environments where TypeScript's module augmentation may not be working correctly.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface SceneCanvasProps {
  screens: ScreenState[];
  doors: DoorState[];
  sceneObjects: SceneObjectState[];
  mooseBot: MooseBotState;
  roomConfig: RoomConfig;
  onToggleManager: () => void;
  onAnimationsLoaded: (names: string[]) => void;
}

const Room = ({ size, wallColor, floorColor }: { size: number, wallColor: string, floorColor: string }) => {
    return (
        <group>
            {/* Walls */}
            <mesh receiveShadow>
                <sphereGeometry args={[size, 64, 64]} />
                <meshStandardMaterial color={wallColor} side={THREE.BackSide} roughness={0.8} />
            </mesh>
            {/* Floor */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -size / 2, 0]}>
                <circleGeometry args={[size, 9]} />
                <meshStandardMaterial color={floorColor} roughness={0.9} />
            </mesh>
        </group>
    )
}

export const SceneCanvas: React.FC<SceneCanvasProps> = memo(({ 
  screens,
  doors,
  sceneObjects,
  mooseBot,
  roomConfig,
  onToggleManager,
  onAnimationsLoaded,
}) => {

  return (
    <Canvas shadows camera={{ fov: 60, near: 1, far: 5000 }}>
        <fog attach="fog" args={['#101010', roomConfig.size * 0.5, roomConfig.size * 2]} />
        <ambientLight intensity={3.0} />
        <pointLight 
            position={[0, -(roomConfig.size / 2) + 30, 0]} 
            intensity={15} 
            distance={1000} 
            color="#ff8844"
            castShadow
        />
        
        <Suspense fallback={<Loader />}>
            <Room size={roomConfig.size} wallColor={roomConfig.wallColor} floorColor={roomConfig.floorColor} />

            {screens.map(screen => (
              screen.isVisible && (
                <Screen 
                  key={screen.id}
                  url={screen.url}
                  position={screen.position as [number, number, number]}
                  rotation={screen.rotation as [number, number, number]}
                  scale={screen.scale}
                />
              )
            ))}

            {doors.map(door => (
                <Door key={door.id} data={door} />
            ))}

            {sceneObjects.map(obj => (
                <SceneObject 
                    key={obj.id}
                    {...obj}
                />
            ))}
            
            <MooseBot 
              {...mooseBot}
              onAnimationsLoaded={onAnimationsLoaded}
            />

            <Hub 
              position={[0, -roomConfig.size / 2, 0]}
              onToggleManager={onToggleManager}
            />
        </Suspense>
        
        <PlayerControls 
            initialPosition={[0, -(roomConfig.size / 2) + 5, roomConfig.size * 0.4]} 
            speed={0.5}
            rotationSpeed={0.02}
        />
    </Canvas>
  );
});

SceneCanvas.displayName = 'SceneCanvas';