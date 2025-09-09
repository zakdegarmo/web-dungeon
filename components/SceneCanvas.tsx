/// <reference types="@react-three/fiber" />
import React, { Suspense, memo, useRef } from 'react';
// Add `type ThreeElements` to import to manually extend JSX namespace for R3F components
import { Canvas, type ThreeElements, type ThreeEvent } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import { Screen } from './Screen';
import { Loader } from './Loader';
import Door from './Doors';
import { SceneObject } from './DecorativeObject';
import { Hub } from './Hub';
import { PlayerControls } from './PlayerControls';
import { MooseBot } from './MooseBot';
import * as THREE from 'three';
import type { ScreenState, DoorState, SceneObjectState, MooseBotState, RoomConfig, Transform } from '../App';
import type { Object3D } from 'three';

// Manually extend JSX.IntrinsicElements to include React Three Fiber's elements.
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
  selectedObjectId: string | number | null;
  transformMode: 'translate' | 'scale' | null;
  onSelectObject: (id: string | number) => void;
  onShowContextMenu: (e: ThreeEvent<MouseEvent>, id: string | number) => void;
  onUpdateObjectTransform: (id: string | number, newTransform: Omit<Transform, 'rotation'> & { rotation: [number, number, number, string?]}) => void;
  onClearSelection: () => void;
}

const Room = ({ size, shape, wallColor, floorColor, geometryConfig, onClick }: { size: number, shape: RoomConfig['shape'], wallColor: string, floorColor: string, geometryConfig: RoomConfig['geometryConfig'], onClick: (e: any) => void }) => {
    // FIX: Explicitly type the dictionaries to ensure TypeScript infers position/rotation as tuples `[number, number, number]` instead of `number[]`, which is required by R3F components.
    const wallPropsData: Record<RoomConfig['shape'], { geometry: JSX.Element; position: [number, number, number]; rotation: [number, number, number] }> = {
        'sphere': { geometry: <sphereGeometry args={[size, geometryConfig.sphere.widthSegments, geometryConfig.sphere.heightSegments]} />, position: [0,0,0], rotation: [0,0,0] },
        'box': { geometry: <boxGeometry args={[size * 2, size, size * 2, geometryConfig.box.widthSegments, geometryConfig.box.heightSegments, geometryConfig.box.depthSegments]} />, position: [0,0,0], rotation: [0,0,0] },
        'cylinder': { geometry: <cylinderGeometry args={[size, size, size, geometryConfig.cylinder.radialSegments, geometryConfig.cylinder.heightSegments, true]} />, position: [0,0,0], rotation: [0,0,0] },
        'cone': { geometry: <coneGeometry args={[size, size, geometryConfig.cone.radialSegments, geometryConfig.cone.heightSegments, true]} />, position: [0,0,0], rotation: [0,0,0] },
        'torus': { geometry: <torusGeometry args={[size, size / 4, geometryConfig.torus.radialSegments, geometryConfig.torus.tubularSegments]} />, position: [0, -size / 2 + size / 4, 0], rotation: [Math.PI / 2, 0, 0] },
        'icosahedron': { geometry: <icosahedronGeometry args={[size, geometryConfig.icosahedron.detail]} />, position: [0,0,0], rotation: [0,0,0] },
        'dodecahedron': { geometry: <dodecahedronGeometry args={[size, geometryConfig.dodecahedron.detail]} />, position: [0,0,0], rotation: [0,0,0] },
    };
    const wallProps = wallPropsData[shape];

    const floorPropsData: Record<RoomConfig['shape'], { geometry: JSX.Element; rotation: [number, number, number] }> = {
        'sphere': { 
            // Corrected radius for the circular floor inside the sphere. The floor is at Y = -size / 2.
            // By Pythagorean theorem, the floor radius is sqrt(size^2 - (size/2)^2).
            geometry: <circleGeometry args={[size * Math.sqrt(0.75), 64]} />, 
            rotation: [-Math.PI / 2, 0, 0] 
        },
        'box': { geometry: <planeGeometry args={[size * 2, size * 2]} />, rotation: [-Math.PI / 2, 0, 0] },
        'cylinder': { geometry: <circleGeometry args={[size, 64]} />, rotation: [-Math.PI / 2, 0, 0] },
        'cone': { geometry: <circleGeometry args={[size, 64]} />, rotation: [-Math.PI / 2, 0, 0] },
        'torus': { geometry: <circleGeometry args={[size - size / 4, 64]} />, rotation: [-Math.PI / 2, 0, 0] },
        'icosahedron': { geometry: <circleGeometry args={[size * 0.85, 64]} />, rotation: [-Math.PI / 2, 0, 0] },
        'dodecahedron': { geometry: <circleGeometry args={[size * 0.85, 64]} />, rotation: [-Math.PI / 2, 0, 0] },
    };
    const floorProps = floorPropsData[shape];


    return (
        <group onClick={onClick}>
            {/* Walls */}
            <mesh receiveShadow position={wallProps.position} rotation={wallProps.rotation}>
                {wallProps.geometry}
                <meshStandardMaterial color={wallColor} side={THREE.BackSide} roughness={0.8} />
            </mesh>
            {/* Floor */}
            <mesh receiveShadow rotation={floorProps.rotation} position={[0, -size / 2, 0]}>
                {floorProps.geometry}
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
  selectedObjectId,
  transformMode,
  onSelectObject,
  onShowContextMenu,
  onUpdateObjectTransform,
  onClearSelection
}) => {
  const objectRefs = useRef<Record<string | number, Object3D | null>>({});

  const handleTransformEnd = (e: any) => {
    if (!selectedObjectId || !e?.target?.object) return;
    const object = e.target.object as Object3D;
    onUpdateObjectTransform(selectedObjectId, {
        position: object.position.toArray(),
        rotation: object.rotation.toArray() as [number, number, number, string],
        scale: object.scale.x, // Assuming uniform scaling for simplicity
    });
  };

  // Calculate fog falloff based on room size and density setting
  const fogNear = roomConfig.size * 0.1;
  // Map 0-100 density to a meaningful 'far' value. Higher density = closer fog.
  const fogFar = roomConfig.size * (4 - (roomConfig.fogDensity / 100) * 3.5);


  return (
    <Canvas shadows camera={{ fov: 60, near: 1, far: 5000 }}>
        <fog attach="fog" args={[roomConfig.fogColor, fogNear, fogFar]} />
        <ambientLight intensity={roomConfig.ambientLightIntensity} />
        <pointLight 
            position={[0, -(roomConfig.size / 2) + 30, 0]} 
            intensity={roomConfig.pointLightIntensity}
            color={roomConfig.pointLightColor}
            distance={1000} 
            castShadow
        />
        
        <Suspense fallback={<Loader />}>
            <Room 
              size={roomConfig.size} 
              shape={roomConfig.shape}
              wallColor={roomConfig.wallColor} 
              floorColor={roomConfig.floorColor}
              geometryConfig={roomConfig.geometryConfig}
              onClick={(e) => { 
                // Only clear selection on a left-click to avoid conflicts with context menu
                if (e.button === 0) {
                  e.stopPropagation(); 
                  onClearSelection(); 
                }
              }}
            />

            {screens.map(screen => (
              screen.isVisible && (
                <Screen 
                  key={screen.id}
                  position={screen.position as [number, number, number]}
                  rotation={screen.rotation as [number, number, number]}
                  scale={screen.scale}
                  url={screen.url}
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
                    // FIX: The ref callback was implicitly returning the result of the assignment, which is not allowed for ref callbacks.
                    // Changed to a block statement to ensure it returns void.
                    ref={el => { objectRefs.current[obj.id] = el as Object3D; }}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        onSelectObject(obj.id);
                    }}
                    onContextMenu={(e) => {
                        e.stopPropagation();
                        onShowContextMenu(e, obj.id);
                    }}
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

        {selectedObjectId && transformMode && objectRefs.current[selectedObjectId] && (
            <TransformControls
                object={objectRefs.current[selectedObjectId]!}
                mode={transformMode}
                onMouseUp={handleTransformEnd}
            />
        )}
        
        <PlayerControls 
            initialPosition={[0, -(roomConfig.size / 2) + 5, roomConfig.size * 0.4]} 
            speed={0.5}
            rotationSpeed={0.02}
        />
    </Canvas>
  );
});

SceneCanvas.displayName = 'SceneCanvas';