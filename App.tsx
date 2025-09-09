
import React, { useState, useCallback, useEffect } from 'react';
import { SceneCanvas } from './components/SceneCanvas';
import { ControlPanel } from './components/ScreenManager';
import type { DoorData as OldDoorData } from './components/Doors';
import { ChatHistory } from './components/ChatHistory';
import { ChatBubble } from './components/Icons';
import { ContextMenu } from './components/ContextMenu';
import type { PrimitiveType } from './types';


// Define unified state structures for all scene objects
export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export interface ScreenState extends Transform {
  id: string | number;
  isVisible: boolean;
  url?: string;
}

export interface DoorState extends Transform {
  id: string | number;
  name: string;
  url: string;
}

export type SceneObjectType = 'model' | 'hologram' | 'primitive';

export interface SceneObjectState extends Transform {
  id:string | number;
  type: SceneObjectType;
  url?: string; 
  primitiveType?: PrimitiveType;
  primitiveParameters?: any;
}

export interface MooseBotState extends Transform {
  url: string;
  dialogue: string;
  activeAnimation: string;
}

export interface GeometryConfig {
  sphere: { widthSegments: number; heightSegments: number };
  box: { widthSegments: number; heightSegments: number; depthSegments: number };
  cylinder: { radialSegments: number; heightSegments: number };
  cone: { radialSegments: number; heightSegments: number };
  torus: { radialSegments: number; tubularSegments: number };
  icosahedron: { detail: number };
  dodecahedron: { detail: number };
}

export interface RoomConfig {
  size: number;
  shape: 'sphere' | 'box' | 'cylinder' | 'cone' | 'torus' | 'icosahedron' | 'dodecahedron';
  wallColor: string;
  floorColor: string;
  ambientLightIntensity: number;
  pointLightIntensity: number;
  pointLightColor: string;
  fogColor: string;
  fogDensity: number; // 0-100
  geometryConfig: GeometryConfig;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
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

// Hardcoded initial positions for screens to lock in the layout
const initialScreens: ScreenState[] = [
  {
    id: 1,
    isVisible: true,
    position: [180, -85, 0],
    rotation: [0, 1.5707963267948966 + Math.PI, 0],
    scale: 1.6,
  },
  {
    id: 2,
    isVisible: true,
    position: [127.27922061357857, -85, 127.27922061357857],
    rotation: [0, 0.7853981633974483 + Math.PI, 0],
    scale: 1.6,
  },
  {
    id: 3,
    isVisible: true,
    position: [0, -85, 180],
    rotation: [0, 0 + Math.PI, 0],
    scale: 1.6,
  },
  {
    id: 4,
    isVisible: true,
    position: [-127.27922061357856, -85, 127.27922061357857],
    rotation: [0, -0.7853981633974483 + Math.PI, 0],
    scale: 1.6,
  },
  {
    id: 5,
    isVisible: true,
    position: [-180, -85, 0],
    rotation: [0, -1.5707963267948966 + Math.PI, 0],
    scale: 1.6,
  },
  {
    id: 6,
    isVisible: true,
    position: [-127.27922061357857, -85, -127.27922061357856],
    rotation: [0, -2.356194490192345 + Math.PI, 0],
    scale: 1.6,
  },
  {
    id: 7,
    isVisible: true,
    position: [0, -85, -180],
    rotation: [0, -3.141592653589793 + Math.PI, 0],
    scale: 1.6,
  },
  {
    id: 8,
    isVisible: true,
    position: [127.27922061357856, -85, -127.27922061357857],
    rotation: [0, -3.9269908169872414 + Math.PI, 0],
    scale: 1.6,
  },
];

// Hardcoded initial positions for doors to lock in the layout
const initialDoors: DoorState[] = [
  {
    id: 'ontology',
    name: 'Ontology',
    url: 'https://zakdegarmo.github.io/MyOntology/',
    position: [220, -110, 0],
    rotation: [0, 1.5707963267948966, 0],
    scale: 1.4,
  },
  {
    id: 'notepad',
    name: 'Notepad',
    url: 'https://zakdegarmo.github.io/ZaksNotepad/index.html',
    position: [168.5542152642095, -110, 141.2820323027551],
    rotation: [0, 0.8726646259971648, 0],
    scale: 1.4,
  },
  {
    id: 'file-explorer',
    name: 'File Explorer',
    url: 'https://3-d-file-explorer.vercel.app/',
    position: [38.20423349051557, -110, 216.7957665094825],
    rotation: [0, 0.17453292519943295, 0],
    scale: 1.4,
  },
  {
    id: 'hap',
    name: 'Hap',
    url: 'https://hyper-aether-pilgrim.vercel.app/',
    position: [-110, -110, 190.5255866034633],
    rotation: [0, -0.5235987755982988, 0],
    scale: 1.4,
  },
  {
    id: '3d-molecule-lab',
    name: '3d Molecule Lab',
    url: 'https://3d-molecule-lab.vercel.app/',
    position: [-206.7957665094825, -110, 75.25423349051566],
    rotation: [0, -1.2217304763960306, 0],
    scale: 1.4,
  },
  {
    id: 'data-vis',
    name: 'Data Vis',
    url: 'https://data-vis-eosin.vercel.app/',
    position: [-206.79576650948253, -110, -75.25423349051552],
    rotation: [0, -1.9198621771937625, 0],
    scale: 1.4,
  },
  {
    id: 'font-fun',
    name: 'Font Fun',
    url: 'https://3d-ttf.vercel.app/',
    position: [-110, -110, -190.52558660346327],
    rotation: [0, -2.6179938779914944, 0],
    scale: 1.4,
  },
  {
    id: 'IDE',
    name: 'IDE',
    url: 'https://my-os-3-d-ide.vercel.app/',
    position: [38.2042334905154, -110, -216.79576650948253],
    rotation: [0, -3.316125578789226, 0],
    scale: 1.4,
  },
  {
    id: 'web-dungeon homepage',
    name: 'Web Dungeon Homepage',
    url: 'https://web-dungeon.vercel.app/',
    position: [168.5542152642094, -110, -141.28203230275518],
    rotation: [0, -4.014257279586958, 0],
    scale: 1.4,
  },
];


const initialSceneObjects: SceneObjectState[] = [];

const initialMooseBotState: MooseBotState = {
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    dialogue: 'Hello! I am MOOSE-BOT. Please provide a Gemini API key to chat with me.',
    activeAnimation: 'Idle',
    position: [0, -125, 15],
    rotation: [0, Math.PI, 0],
    scale: 6,
};

const initialGeometryConfig: GeometryConfig = {
    sphere: { widthSegments: 64, heightSegments: 64 },
    box: { widthSegments: 1, heightSegments: 1, depthSegments: 1 },
    cylinder: { radialSegments: 64, heightSegments: 1 },
    cone: { radialSegments: 64, heightSegments: 1 },
    torus: { radialSegments: 16, tubularSegments: 100 },
    icosahedron: { detail: 1 },
    dodecahedron: { detail: 1 },
};

const initialRoomConfig: RoomConfig = {
    size: 250,
    shape: 'sphere',
    wallColor: '#444444',
    floorColor: '#555555',
    ambientLightIntensity: 3.0,
    pointLightIntensity: 15,
    pointLightColor: '#ff8844',
    fogColor: '#101010',
    fogDensity: 50, // Mid-range density
    geometryConfig: initialGeometryConfig,
};


const App: React.FC = () => {
  const [key, setKey] = useState<number>(0);
  const [screens, setScreens] = useState<ScreenState[]>(initialScreens);
  const [doors, setDoors] = useState<DoorState[]>(initialDoors);
  const [sceneObjects, setSceneObjects] = useState<SceneObjectState[]>(initialSceneObjects);
  const [mooseBot, setMooseBot] = useState<MooseBotState>(initialMooseBotState);
  const [animationNames, setAnimationNames] = useState<string[]>([]);
  const [roomConfig, setRoomConfig] = useState<RoomConfig>(initialRoomConfig);
  const [isManagerVisible, setIsManagerVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isBotChatting, setIsBotChatting] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { sender: 'bot', text: initialMooseBotState.dialogue }
  ]);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | number | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'scale' | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [codeContext, setCodeContext] = useState<string>('');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini-api-key');
    if (storedKey) {
        setApiKey(storedKey);
    }
  }, []);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini-api-key', key);
  };
  
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

  const handleLoadConfiguration = (config: { screens?: ScreenState[]; doors?: DoorState[]; sceneObjects?: SceneObjectState[], mooseBot?: MooseBotState, room?: Partial<RoomConfig> }) => {
    if (config.screens) setScreens(config.screens);
    if (config.doors) setDoors(config.doors);
    if (config.sceneObjects) setSceneObjects(config.sceneObjects);
    if (config.mooseBot) setMooseBot(config.mooseBot);
    if (config.room) {
        const loadedRoomConfig = config.room;
        // Deep merge geometryConfig to ensure defaults are kept for any missing properties
        const mergedGeometryConfig = {
            ...initialRoomConfig.geometryConfig,
            ...(loadedRoomConfig.geometryConfig || {}),
        };
        const finalRoomConfig = {
            ...initialRoomConfig, // Base defaults
            ...loadedRoomConfig,  // Loaded values override base
            geometryConfig: mergedGeometryConfig, // Use the carefully merged geometry config
        };
        setRoomConfig(finalRoomConfig);
    }
    setKey(prevKey => prevKey + 1); // Re-render canvas
    setIsManagerVisible(false); // Close panel after loading
  };

  const handleChatWithBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
        const errorMsg = 'Please enter your Gemini API key to chat with MOOSE-BOT.';
        setMooseBot(prev => ({ ...prev, dialogue: errorMsg }));
        setChatHistory(prev => [...prev, { sender: 'bot', text: errorMsg }]);
        return;
    }

    const trimmedInput = chatInput.trim();
    if (!trimmedInput || isBotChatting) return;

    const userMessage: ChatMessage = { sender: 'user', text: trimmedInput };
    setChatHistory(prev => [...prev, userMessage]);
    setChatInput('');
    setIsBotChatting(true);
    setMooseBot(prev => ({ ...prev, dialogue: 'Thinking...' }));

    try {
        const response = await fetch('/api/chat-with-bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: trimmedInput, apiKey, context: codeContext }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            try {
                // Try to parse as JSON, as the server might send a structured error
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorMessage;
            } catch (e) {
                // Not JSON, maybe it's the error message itself or an HTML page
                if (errorText) {
                    errorMessage = errorText.substring(0, 200); // Truncate long HTML errors
                }
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        const botMessageText = data.response;

        setMooseBot(prev => ({ ...prev, dialogue: botMessageText }));
        const botMessage: ChatMessage = { sender: 'bot', text: botMessageText };
        setChatHistory(prev => [...prev, botMessage]);

    } catch (error) {
        console.error("Failed to chat with bot:", error);
        const errorMessage = error instanceof Error ? error.message : 'Sorry, I had a connection error.';
        setMooseBot(prev => ({ ...prev, dialogue: errorMessage }));
        const botMessage: ChatMessage = { sender: 'bot', text: errorMessage };
        setChatHistory(prev => [...prev, botMessage]);
    } finally {
        setIsBotChatting(false);
    }
  };

  const handleGenerateRoom = async (prompt: string, part: string): Promise<any> => {
     if (!apiKey) {
        throw new Error("Please provide your Gemini API key in the main interface to use this feature.");
    }
    const response = await fetch('/api/generate-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, apiKey, part }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
        } catch (e) {
            if (errorText) {
                errorMessage = errorText.substring(0, 200); // Truncate long HTML errors
            }
        }
        throw new Error(errorMessage);
    }
    
    return await response.json();
  };
  
  const handleCodeContextChange = (content: string, filePath: string) => {
      setCodeContext(content);
      // Create a data URL to display the code on the first screen
      if (screens.length > 0) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>${filePath}</title>
              <style>
                body { background-color: #111; color: #eee; font-family: monospace; font-size: 14px; margin: 0; }
                pre { margin: 1rem; white-space: pre-wrap; word-wrap: break-word; }
              </style>
            </head>
            <body>
              <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </body>
          </html>
        `;
        const dataUrl = `data:text/html,${encodeURIComponent(htmlContent)}`;
        
        setScreens(prevScreens => {
            const newScreens = [...prevScreens];
            newScreens[0] = { ...newScreens[0], url: dataUrl };
            return newScreens;
        });
        setKey(prevKey => prevKey + 1); // Force re-render
      }
  };

  const handleToggleManager = useCallback(() => {
    setIsManagerVisible(v => !v);
  }, []);

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };
  
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect on a left-click. A right-click (e.button === 2) is for context menus.
    if (e.button === 0) {
      setSelectedObjectId(null);
      setTransformMode(null);
      handleCloseContextMenu();
    }
  };
  
  const handleDeleteObject = (id: string | number) => {
    setSceneObjects(prev => prev.filter(obj => obj.id !== id));
    if (selectedObjectId === id) {
        setSelectedObjectId(null);
        setTransformMode(null);
    }
    handleCloseContextMenu();
  };

  const handleUpdateObjectTransform = (id: string | number, newTransform: Omit<Transform, 'rotation'> & { rotation: [number, number, number, string?] }) => {
    setSceneObjects(prev =>
        prev.map(obj => (obj.id === id ? { ...obj, ...newTransform, rotation: [newTransform.rotation[0], newTransform.rotation[1], newTransform.rotation[2]] } : obj))
    );
  };

  const handleSetTransformMode = (mode: 'translate' | 'scale') => {
    setTransformMode(mode);
    handleCloseContextMenu();
  };


  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans"
      onClick={handleCanvasClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isManagerVisible && (
        <ControlPanel
          screens={screens}
          doors={doors}
          sceneObjects={sceneObjects}
          mooseBot={mooseBot}
          animationNames={animationNames}
          roomConfig={roomConfig}
          apiKey={apiKey}
          onApiKeyChange={handleApiKeyChange}
          onApply={handleApplyChanges}
          onLoadConfiguration={handleLoadConfiguration}
          onGenerateRoom={handleGenerateRoom}
          onCodeContextChange={handleCodeContextChange}
          onClose={() => setIsManagerVisible(false)}
        />
      )}
      
      {contextMenu && selectedObjectId && (
        <ContextMenu 
          x={contextMenu.x}
          y={contextMenu.y}
          targetId={selectedObjectId}
          onSetTransformMode={handleSetTransformMode}
          onDeleteObject={handleDeleteObject}
          onClose={handleCloseContextMenu}
        />
      )}

      {isChatVisible && <ChatHistory history={chatHistory} onClose={() => setIsChatVisible(false)} />}

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
          selectedObjectId={selectedObjectId}
          transformMode={transformMode}
          onSelectObject={setSelectedObjectId}
          onShowContextMenu={(e, targetId) => {
            // R3F events are not standard React MouseEvents. The `nativeEvent` property must be accessed.
            (e as any).nativeEvent.preventDefault();
            e.stopPropagation();
            setSelectedObjectId(targetId);
            setContextMenu({ x: e.clientX, y: e.clientY });
          }}
          onUpdateObjectTransform={handleUpdateObjectTransform}
          onClearSelection={() => {
            setSelectedObjectId(null);
            setTransformMode(null);
          }}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col">
        <div className="w-full p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-cyan-400 tracking-wider">MOOSE</h1>
              
              <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="Enter Gemini API Key..."
                  className="bg-gray-800 border border-gray-600 rounded-md px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 w-full max-w-xs"
                  aria-label="Gemini API Key"
                  autoComplete="off"
              />

              <form onSubmit={handleChatWithBot} className="flex items-center gap-2 w-full flex-grow">
                  <button type="button" onClick={() => setIsChatVisible(v => !v)} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-md transition-colors text-white flex-shrink-0" title="Toggle Chat History">
                    <ChatBubble />
                  </button>
                  <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask MOOSE-BOT about the code..."
                      className="bg-gray-800 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full flex-grow"
                      disabled={isBotChatting}
                  />
                  <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 flex-shrink-0" disabled={isBotChatting}>
                      {isBotChatting ? '...' : 'Send'}
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
