

import React, { useState, useCallback } from 'react';
import { SceneCanvas } from './components/SceneCanvas';
import { ControlPanel } from './components/ScreenManager';
import type { DoorData as OldDoorData } from './components/Doors';

// Define unified state structures for all scene objects
export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export interface ScreenState extends Transform {
  id: string | number;
  url: string;
  isVisible: boolean;
}

export interface DoorState extends Transform {
  id: string | number;
  name: string;
  url: string;
}

export type SceneObjectType = 'model' | 'hologram';

export interface SceneObjectState extends Transform {
  id:string | number;
  url: string; 
  type: SceneObjectType;
}

export interface MooseBotState extends Transform {
  url: string;
  dialogue: string;
  activeAnimation: string;
}

export interface RoomConfig {
  size: number;
  wallColor: string;
  floorColor: string;
}


// Define portal door data centrally so it can be used for both doors and screen positioning
const portalDoorData: OldDoorData[] = [
    { id: 'ontology', link: 'https://zakdegarmo.github.io/MyOntology/', type: 'portal' },
    { id: 'notepad', link: 'https://zakdegarmo.github.io/ZaksNotepad/index.html', type: 'portal' },
    { id: 'file-explorer', link: 'https://3-d-file-explorer.vercel.app/', type: 'portal' },
    { id: 'hap', link: 'https://hyper-aether-pilgrim.vercel.app/', type: 'portal'},
    { id: '3d-molecule-lab', link: 'https://3d-molecule-lab.vercel.app/', type: 'portal' },
    { id: 'data-vis', link: 'https://data-vis-eosin.vercel.app/', type: 'portal' },
    { id: 'font-fun', link: 'https://3d-ttf.vercel.app/', type: 'portal' },
    { id: 'IDE', link: 'https://my-os-3-d-ide.vercel.app/', type: 'portal' },
    { id: 'web-dungeon homepage', link: 'https://web-dungeon.vercel.app/', type: 'portal' },
];

const PORTAL_DOOR_RADIUS = 220;
const PORTAL_DOOR_Y = -110;
const PORTAL_DOOR_SCALE = 1.4;

const TOTAL_SCREENS = 8;
const SCREEN_RADIUS = 180; // Decoupled from door radius
const SCREEN_Y_POS = -85;

const initialScreenUrls = [
  'https://zakdegarmo.github.io/MyOntology/',
  'https://zakdegarmo.github.io/ZaksNotepad/index.html',
  'https://3-d-file-explorer.vercel.app/',
  'https://hyper-aether-pilgrim.vercel.app/',
  'https://3d-molecule-lab.vercel.app/',
  'https://data-vis-eosin.vercel.app/',
  'https://3d-ttf.vercel.app/',
  'https://my-os-3-d-ide.vercel.app/',
];

// Generate initial screens positioned in a full circle
const initialScreens: ScreenState[] = Array.from({ length: TOTAL_SCREENS }, (_, index) => {
    const angle = (index / TOTAL_SCREENS) * Math.PI * 2;
    const x = Math.cos(angle) * SCREEN_RADIUS;
    const z = Math.sin(angle) * SCREEN_RADIUS;
    
    return {
      id: index + 1,
      url: initialScreenUrls[index],
      isVisible: true,
      position: [x, SCREEN_Y_POS, z],
      rotation: [0, 0, 0],
      scale: 1.6,
    };
});

// Generate initial doors in a circle with full transform properties
const initialDoors: DoorState[] = portalDoorData.map((door, index) => {
    const angle = (index / portalDoorData.length) * Math.PI * 2;
    const x = Math.cos(angle) * PORTAL_DOOR_RADIUS;
    const z = Math.sin(angle) * PORTAL_DOOR_RADIUS;
    const rotationY = -angle + Math.PI / 2; // Face the center

    return {
        id: door.id,
        name: door.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        url: door.link,
        position: [x, PORTAL_DOOR_Y, z],
        rotation: [0, rotationY, 0],
        scale: PORTAL_DOOR_SCALE,
    };
});

const initialSceneObjects: SceneObjectState[] = [];

const initialMooseBotState: MooseBotState = {
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    dialogue: 'Hello! I am MOOSE-BOT. Ask me anything!',
    activeAnimation: 'Idle',
    position: [0, -125, 15],
    rotation: [0, Math.PI, 0],
    scale: 6,
};


const App: React.FC = () => {
  const [url, setUrl] = useState<string>(initialScreenUrls[0] || 'https://www.google.com');
  const [key, setKey] = useState<number>(0);
  const [screens, setScreens] = useState<ScreenState[]>(initialScreens);
  const [doors, setDoors] = useState<DoorState[]>(initialDoors);
  const [sceneObjects, setSceneObjects] = useState<SceneObjectState[]>(initialSceneObjects);
  const [mooseBot, setMooseBot] = useState<MooseBotState>(initialMooseBotState);
  const [animationNames, setAnimationNames] = useState<string[]>([]);
  const [roomConfig, setRoomConfig] = useState<RoomConfig>({
    size: 250,
    wallColor: '#444444',
    floorColor: '#555555',
  });
  const [isManagerVisible, setIsManagerVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isBotChatting, setIsBotChatting] = useState(false);

  const updateMainScreenUrl = (newUrl: string) => {
     setScreens(prevScreens => {
      const firstVisibleIndex = prevScreens.findIndex(s => s.isVisible);
      if (firstVisibleIndex !== -1) {
        const newScreens = [...prevScreens];
        newScreens[firstVisibleIndex] = { ...newScreens[firstVisibleIndex], url: newUrl };
        return newScreens;
      }
      // If no screen is visible, update the first one
      if(prevScreens.length > 0) {
        const newScreens = [...prevScreens];
        newScreens[0] = { ...newScreens[0], url: newUrl, isVisible: true };
        return newScreens;
      }
      return prevScreens;
    });
    setUrl(newUrl);
    setKey(prevKey => prevKey + 1);
  };

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (url.trim() === '') return;
    let finalUrl = url;
    if (!/^(https|http|file|ftp|\/)/i.test(url)) {
      finalUrl = 'https://' + url;
    }
    updateMainScreenUrl(finalUrl);
  }, [url]);
  
  const handleApplyChanges = (
    updatedScreens: ScreenState[], 
    updatedDoors: DoorState[], 
    updatedObjects: SceneObjectState[], 
    updatedBot: MooseBotState,
    updatedRoomConfig: RoomConfig
  ) => {
    setScreens(updatedScreens);
    setDoors(updatedDoors);
    setSceneObjects(updatedObjects);
    setMooseBot(updatedBot);
    setRoomConfig(updatedRoomConfig);
    setKey(prevKey => prevKey + 1); // Re-render canvas
  };

  const handleLoadConfiguration = (config: { screens?: ScreenState[]; doors?: DoorState[]; sceneObjects?: SceneObjectState[], mooseBot?: MooseBotState, room?: RoomConfig }) => {
    if (config.screens) setScreens(config.screens);
    if (config.doors) setDoors(config.doors);
    if (config.sceneObjects) setSceneObjects(config.sceneObjects);
    if (config.mooseBot) setMooseBot(config.mooseBot);
    if (config.room) setRoomConfig(config.room);
    setKey(prevKey => prevKey + 1); // Re-render canvas
    setIsManagerVisible(false); // Close panel after loading
  };

  const handleChatWithBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isBotChatting) return;

    setIsBotChatting(true);
    setMooseBot(prev => ({ ...prev, dialogue: 'Thinking...' }));

    try {
        const response = await fetch('/api/chat-with-bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: chatInput }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        setMooseBot(prev => ({ ...prev, dialogue: data.response }));
        setChatInput('');

    } catch (error) {
        console.error("Failed to chat with bot:", error);
        setMooseBot(prev => ({ ...prev, dialogue: 'Sorry, I had a connection error.' }));
    } finally {
        setIsBotChatting(false);
    }
  };

  const handleToggleManager = useCallback(() => {
    setIsManagerVisible(v => !v);
  }, []);


  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans">
      {isManagerVisible && (
        <ControlPanel
          screens={screens}
          doors={doors}
          sceneObjects={sceneObjects}
          mooseBot={mooseBot}
          animationNames={animationNames}
          roomConfig={roomConfig}
          onApply={handleApplyChanges}
          onLoadConfiguration={handleLoadConfiguration}
          onClose={() => setIsManagerVisible(false)}
        />
      )}

      <div className="w-full h-full">
        <SceneCanvas 
          key={key} 
          screens={screens}
          doors={doors}
          sceneObjects={sceneObjects}
          mooseBot={mooseBot}
          roomConfig={roomConfig}
          onToggleManager={handleToggleManager}
          onAnimationsLoaded={setAnimationNames}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col">
        <div className="w-full p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-cyan-400 tracking-wider">MOOSE</h1>
              
              <form onSubmit={handleChatWithBot} className="flex items-center gap-2 w-full sm:w-auto sm:flex-grow max-w-xl">
                  <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask MOOSE-BOT..."
                      className="bg-gray-800 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                      disabled={isBotChatting}
                  />
                  <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50" disabled={isBotChatting}>
                      {isBotChatting ? '...' : 'Send'}
                  </button>
              </form>
              
              <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full sm:w-auto sm:flex-grow max-w-xl">
                  <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL for main screen..."
                  className="bg-gray-800 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full"
                  />
                  <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                  Load
                  </button>
              </form>
            </div>
        </div>

        <div className="w-full p-2 bg-black bg-opacity-50 text-center text-xs text-gray-400">
            <p>Controls: [W, A, S, D] to Move | [SHIFT] to Sprint | [Q, E] to Turn | [R, F] to Look Up/Down | [Z, C] to Move Up/Down | Click Hub to manage scene.</p>
            <p>Note: Some sites may not load due to security policies (X-Frame-Options). This is a browser security feature.</p>
        </div>
      </div>
    </div>
  );
};

export default App;