
import React, { useState, useRef, useEffect } from 'react';
// FIX: Correct casing for icons import to resolve module ambiguity.
import { Eye, EyeOff } from './Icons';
import type { ScreenState, DoorState, SceneObjectState, MooseBotState, RoomConfig, SceneObjectType, GeometryConfig } from '../App';
import type { PrimitiveType } from '../types';

interface ControlPanelProps {
  screens: ScreenState[];
  doors: DoorState[];
  sceneObjects: SceneObjectState[];
  mooseBot: MooseBotState;
  animationNames: string[];
  roomConfig: RoomConfig;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onApply: (screens: ScreenState[], doors: DoorState[], sceneObjects: SceneObjectState[], mooseBot: MooseBotState, roomConfig: RoomConfig) => void;
  onLoadConfiguration: (config: any) => void;
  onGenerateRoom: (prompt: string, part: string) => Promise<any>;
  onCodeContextChange: (content: string, filePath: string) => void;
  onClose: () => void;
}

type Tab = 'screens' | 'doors' | 'objects' | 'bot' | 'room' | 'settings' | 'community' | 'generation' | 'inspector';

const sourceFiles = [
    'App.tsx',
    'components/SceneCanvas.tsx',
    'components/ScreenManager.tsx',
    'components/MooseBot.tsx',
    'api/chat-with-bot.js',
    'api/generate-room.js',
];


const SliderInput: React.FC<{ label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min: number; max: number; step: number; displayValue?: string; className?: string;}> = ({ label, value, onChange, min, max, step, displayValue, className }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-sm text-gray-400 mb-1 whitespace-nowrap">{label}</label>
        <div className="flex items-center gap-2">
            <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} className="w-full" />
            <span className="text-cyan-400 text-sm w-12 text-right">{displayValue || value}</span>
        </div>
    </div>
);

const RemoveButton: React.FC<{onClick: () => void}> = ({onClick}) => (
    <button onClick={onClick} className="absolute top-2 right-2 text-gray-500 hover:text-red-500 font-bold text-lg leading-none p-1">&times;</button>
)

export const ControlPanel: React.FC<ControlPanelProps> = ({ screens, doors, sceneObjects, mooseBot, animationNames, roomConfig, apiKey, onApiKeyChange, onApply, onLoadConfiguration, onGenerateRoom, onCodeContextChange, onClose }) => {
  const [localScreens, setLocalScreens] = useState(screens);
  const [localDoors, setLocalDoors] = useState(doors);
  const [localObjects, setLocalObjects] = useState(sceneObjects);
  const [localBot, setLocalBot] = useState(mooseBot);
  const [localRoomConfig, setLocalRoomConfig] = useState(roomConfig);
  const [activeTab, setActiveTab] = useState<Tab>('room');
  const [screenLayoutRadius, setScreenLayoutRadius] = useState(roomConfig.size * 0.72); // Dynamic radius based on room size
  const [doorLayoutRadius, setDoorLayoutRadius] = useState(roomConfig.size * 0.88);   // Dynamic radius based on room size
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUploadRef = useRef<HTMLInputElement>(null);
  const [generationPrompt, setGenerationPrompt] = useState('A futuristic sci-fi library with glowing books.');
  const [generatedConfig, setGeneratedConfig] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [communityModels, setCommunityModels] = useState<{ url: string; description: string }[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [selectedCommunityModelUrl, setSelectedCommunityModelUrl] = useState('');
  const [selectedSourceFile, setSelectedSourceFile] = useState<string>('');
  const [primitiveToAdd, setPrimitiveToAdd] = useState<PrimitiveType>('box');


  // When a new config is loaded via props, sync the local state for the room and layout radii.
  useEffect(() => {
    setLocalRoomConfig(roomConfig);
    setScreenLayoutRadius(roomConfig.size * 0.72);
    setDoorLayoutRadius(roomConfig.size * 0.88);
  }, [roomConfig]);

  useEffect(() => {
    const fetchModels = async () => {
        try {
            setModelsError(null);
            const response = await fetch('/api/fetch-models');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch models: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            setCommunityModels(data);
        } catch (error: any) {
            console.error("Fetch models error:", error);
            setModelsError(error.message);
        } finally {
            setIsLoadingModels(false);
        }
    };

    fetchModels();
  }, []); // Run once on component mount
  
  // Effect for the Code Inspector
  useEffect(() => {
    if (activeTab === 'inspector' && selectedSourceFile) {
        const fetchFileContent = async () => {
            try {
                const response = await fetch(`/api/get-file-content?filePath=${encodeURIComponent(selectedSourceFile)}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch file content: ${await response.text()}`);
                }
                const data = await response.json();
                onCodeContextChange(data.content, selectedSourceFile);
            } catch (error: any) {
                console.error("Error fetching file content:", error);
                onCodeContextChange(`// Error loading ${selectedSourceFile}:\n// ${error.message}`, selectedSourceFile);
            }
        };
        fetchFileContent();
    }
  }, [selectedSourceFile, activeTab, onCodeContextChange]);

  const handleApplyChanges = () => {
    onApply(localScreens, localDoors, localObjects, localBot, localRoomConfig);
    onClose();
  };

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text === 'string') {
                const config = JSON.parse(text);
                // backward compatibility for old config files
                if (config.decorativeObjects && !config.sceneObjects) {
                    config.sceneObjects = config.decorativeObjects.map((o: any) => ({...o, type: 'model'}));
                    delete config.decorativeObjects;
                }
                onLoadConfiguration(config);
            }
        } catch (error) {
            console.error("Failed to parse configuration file:", error);
            alert("Error: Invalid or corrupted configuration file.");
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleSaveConfig = () => {
    try {
        const configToSave = generatedConfig ? generatedConfig : {
            screens: localScreens,
            doors: localDoors,
            sceneObjects: localObjects,
            mooseBot: localBot,
            room: localRoomConfig,
        };
        const dataStr = JSON.stringify(configToSave, null, 2);
        const blob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'nexus-config.json';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to save configuration:", error);
        alert("An error occurred while saving the configuration.");
    }
  };
  
  const handleObjectUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
            const newObject: SceneObjectState = {
                id: Date.now(),
                url: dataUrl,
                type: 'model',
                position: [0, -localRoomConfig.size / 2 + 5, -150],
                rotation: [0, 0, 0],
                scale: 10,
            };
            setLocalObjects(prev => [...prev, newObject]);
        }
    };
    reader.readAsDataURL(file);
    event.target.value = ''; // Reset file input
  };
  
  const handleRoomChange = (field: keyof Omit<RoomConfig, 'geometryConfig'>, value: any) => {
      setLocalRoomConfig(prev => ({ ...prev, [field]: value }));
      // Also update the layout radii when the size slider is changed.
      if (field === 'size') {
        const numericValue = Number(value);
        setScreenLayoutRadius(numericValue * 0.72);
        setDoorLayoutRadius(numericValue * 0.88);
      }
  };

  const handleGeometryChange = (shape: keyof GeometryConfig, field: string, value: number) => {
    setLocalRoomConfig(prev => ({
        ...prev,
        geometryConfig: {
            ...prev.geometryConfig,
            [shape]: {
                ...prev.geometryConfig[shape],
                [field]: value,
            }
        }
    }));
  };
    
  const handleBotChange = (field: keyof MooseBotState, value: any) => {
      setLocalBot(prev => ({ ...prev, [field]: value }));
  };

  const handleArrangeInCircle = (type: 'screens' | 'doors') => {
    if (type === 'screens') {
        const count = localScreens.length;
        if (count === 0) return;
        const newItems = localScreens.map((item, index) => {
            const angle = (index / count) * Math.PI * 2;
            const x = Math.cos(angle) * screenLayoutRadius;
            const z = Math.sin(angle) * screenLayoutRadius;
            const rotationY = -angle + Math.PI / 2;
            return { ...item, position: [x, item.position[1], z] as [number,number,number], rotation: [item.rotation[0], rotationY, item.rotation[2]] as [number,number,number] };
        });
        setLocalScreens(newItems);
    }
    if (type === 'doors') {
        const count = localDoors.length;
        if (count === 0) return;
        const newItems = localDoors.map((item, index) => {
            const angle = (index / count) * Math.PI * 2;
            const x = Math.cos(angle) * doorLayoutRadius;
            const z = Math.sin(angle) * doorLayoutRadius;
            const rotationY = -angle + Math.PI / 2;
            return { ...item, position: [x, item.position[1], z] as [number,number,number], rotation: [item.rotation[0], rotationY, item.rotation[2]] as [number,number,number] };
        });
        setLocalDoors(newItems);
    }
  };
  
  const handleAddCommunityModel = () => {
    if (!selectedCommunityModelUrl) return;

    const newObject: SceneObjectState = {
        id: Date.now(),
        url: selectedCommunityModelUrl,
        type: 'model',
        position: [0, -localRoomConfig.size / 2 + 5, -150],
        rotation: [0, 0, 0],
        scale: 10,
    };
    setLocalObjects(prev => [...prev, newObject]);
    setSelectedCommunityModelUrl('');
  };

  const handleGenerateRoom = async () => {
    if (!generationPrompt.trim()) {
        setGenerationError('Please enter a theme or description for the room.');
        return;
    }
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedConfig(null);

    try {
        const generationParts = [
            { key: 'room', label: 'Designing room colors and textures...' },
            { key: 'screens', label: 'Placing virtual screens...' },
            { key: 'doors', label: 'Hanging the doors...' },
            { key: 'sceneObjects', label: 'Arranging decorative objects...' }
        ];

        let fullConfig: any = {};

        for (const part of generationParts) {
            setGenerationStatus(part.label);
            const result = await onGenerateRoom(generationPrompt, part.key);
            fullConfig = { ...fullConfig, ...result };
        }
        
        setGenerationStatus("Finalizing scene...");
        await new Promise(resolve => setTimeout(resolve, 500));

        setGeneratedConfig(fullConfig);
    } catch (error: any) {
        setGenerationError(error.message || 'An unknown error occurred during generation.');
    } finally {
        setIsGenerating(false);
        setGenerationStatus(null);
    }
  };
  
  const handleAddPrimitive = () => {
    let defaultParams;
    switch(primitiveToAdd) {
        case 'box':
            defaultParams = { width: 10, height: 10, depth: 10 };
            break;
        case 'sphere':
            defaultParams = { radius: 8, widthSegments: 32, heightSegments: 16 };
            break;
        case 'cylinder':
            defaultParams = { radiusTop: 5, radiusBottom: 5, height: 20, radialSegments: 32 };
            break;
        default:
            defaultParams = {};
    }

    const newItem: SceneObjectState = {
        id: `primitive-${Date.now()}`,
        type: 'primitive',
        primitiveType: primitiveToAdd,
        primitiveParameters: defaultParams,
        position: [
            (Math.random() - 0.5) * 50,
            -localRoomConfig.size / 2 + 15,
            -150 + (Math.random() - 0.5) * 50
        ],
        rotation: [0, 0, 0],
        scale: 1,
    };
    setLocalObjects(prev => [...prev, newItem]);
  };
  
  const removeItem = (type: Tab, id: number | string) => {
    if (type === 'screens') setLocalScreens(prev => prev.filter(s => s.id !== id));
    if (type === 'doors') setLocalDoors(prev => prev.filter(d => d.id !== id));
    if (type === 'objects') setLocalObjects(prev => prev.filter(o => o.id !== id));
  };
  
  const handleItemChange = (id: number | string, field: string, value: any) => {
    setLocalObjects(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  };
  
  const handlePrimitiveParamChange = (id: number | string, param: string, value: number) => {
     setLocalObjects(prev => prev.map(o => {
        if (o.id === id && o.type === 'primitive') {
            return {
                ...o,
                primitiveParameters: {
                    ...o.primitiveParameters,
                    [param]: value,
                }
            };
        }
        return o;
     }));
  };


  const TabButton: React.FC<{tabId: Tab; children: React.ReactNode}> = ({tabId, children}) => (
      <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === tabId ? 'bg-gray-800 text-cyan-400' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
          {children}
      </button>
  );

  const renderTransformControls = (item: any, onChange: (field: string, value: any) => void) => (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-700/50">
        <SliderInput label="Position X" value={item.position[0]} onChange={e => onChange('position', [Number(e.target.value), item.position[1], item.position[2]])} min={-300} max={300} step={1} />
        <SliderInput label="Position Y" value={item.position[1]} onChange={e => onChange('position', [item.position[0], Number(e.target.value), item.position[2]])} min={-200} max={100} step={1} />
        <SliderInput label="Position Z" value={item.position[2]} onChange={e => onChange('position', [item.position[0], item.position[1], Number(e.target.value)])} min={-300} max={300} step={1} />
        <SliderInput label="Scale" value={item.scale} onChange={e => onChange('scale', Number(e.target.value))} min={0.1} max={100} step={0.1} />
        <SliderInput label="Rotation X" value={item.rotation[0]} onChange={e => onChange('rotation', [Number(e.target.value), item.rotation[1], item.rotation[2]])} min={-Math.PI} max={Math.PI} step={0.01} displayValue={`${(item.rotation[0] * 180 / Math.PI).toFixed(0)}°`} />
        <SliderInput label="Rotation Y" value={item.rotation[1]} onChange={e => onChange('rotation', [item.rotation[0], Number(e.target.value), item.rotation[2]])} min={-Math.PI} max={Math.PI} step={0.01} displayValue={`${(item.rotation[1] * 180 / Math.PI).toFixed(0)}°`} />
        <SliderInput label="Rotation Z" value={item.rotation[2]} onChange={e => onChange('rotation', [item.rotation[0], item.rotation[1], Number(e.target.value)])} min={-Math.PI} max={Math.PI} step={0.01} displayValue={`${(item.rotation[2] * 180 / Math.PI).toFixed(0)}°`} />
     </div>
  );

  return (
    <div className="absolute inset-0 z-30 bg-black bg-opacity-70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-cyan-500/50 rounded-lg shadow-2xl p-6 w-full max-w-4xl text-white font-mono flex flex-col h-full max-h-[90vh] relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3 flex-shrink-0">
          <h2 className="text-2xl font-bold text-cyan-400">Nexus Control Panel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
        </div>
        
        <div className="flex border-b border-gray-700 flex-shrink-0 overflow-x-auto">
            <TabButton tabId="room">Room</TabButton>
            <TabButton tabId="screens">Screens</TabButton>
            <TabButton tabId="doors">Doors</TabButton>
            <TabButton tabId="objects">Objects</TabButton>
            <TabButton tabId="bot">MOOSE-BOT</TabButton>
            <TabButton tabId="generation">Universe</TabButton>
            <TabButton tabId="inspector">Code Inspector</TabButton>
            <TabButton tabId="settings">Settings</TabButton>
        </div>

        <div className="flex-grow overflow-y-auto p-4 bg-gray-800 rounded-b-md">
            {activeTab === 'bot' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-cyan-300">MOOSE-BOT Configuration</h3>
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Model URL</label>
                        <input type="text" value={localBot.url} onChange={e => handleBotChange('url', e.target.value)} className="w-full bg-gray-700 p-2 rounded-md" />
                    </div>
                     <div>
                        <label className="text-sm text-gray-400 mb-1 block">Active Animation</label>
                        <select value={localBot.activeAnimation} onChange={e => handleBotChange('activeAnimation', e.target.value)} className="w-full bg-gray-700 p-2 rounded-md">
                            {animationNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                    {renderTransformControls(localBot, (field, value) => handleBotChange(field as keyof MooseBotState, value))}
                </div>
            )}

            {activeTab === 'screens' && (
                <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-cyan-300">Screens</h3>
                        <button onClick={() => {}} className="bg-cyan-600 px-3 py-1 rounded-md text-sm">Add Screen</button>
                    </div>
                    <div className="flex items-center gap-4">
                        <SliderInput label="Arrange Radius" value={screenLayoutRadius} onChange={e => setScreenLayoutRadius(Number(e.target.value))} min={50} max={300} step={1} className="flex-grow" />
                        <button onClick={() => handleArrangeInCircle('screens')} className="bg-purple-600 px-3 py-1 rounded-md text-sm mt-5">Arrange in Circle</button>
                    </div>
                    {localScreens.map(s => (
                        <div key={s.id} className="bg-gray-700/50 p-3 rounded-md relative">
                            <RemoveButton onClick={() => {}} />
                            <div className="flex items-center gap-4">
                                <input type="text" placeholder="URL" value={s.url || ''} onChange={e => {}} className="w-full bg-gray-800 p-2 rounded-md" />
                                <button onClick={() => {}} className="text-cyan-400">
                                    {s.isVisible ? <Eye /> : <EyeOff />}
                                </button>
                            </div>
                            {renderTransformControls(s, (field, value) => {})}
                        </div>
                    ))}
                </div>
            )}
            
            {activeTab === 'doors' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-cyan-300">Doors</h3>
                        <button onClick={() => {}} className="bg-cyan-600 px-3 py-1 rounded-md text-sm">Add Door</button>
                    </div>
                     <div className="flex items-center gap-4">
                        <SliderInput label="Arrange Radius" value={doorLayoutRadius} onChange={e => setDoorLayoutRadius(Number(e.target.value))} min={50} max={300} step={1} className="flex-grow" />
                        <button onClick={() => handleArrangeInCircle('doors')} className="bg-purple-600 px-3 py-1 rounded-md text-sm mt-5">Arrange in Circle</button>
                    </div>
                    {localDoors.map(d => (
                         <div key={d.id} className="bg-gray-700/50 p-3 rounded-md relative">
                            <RemoveButton onClick={() => {}} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Name" value={d.name} onChange={e => {}} className="w-full bg-gray-800 p-2 rounded-md" />
                                <input type="text" placeholder="URL" value={d.url} onChange={e => {}} className="w-full bg-gray-800 p-2 rounded-md" />
                            </div>
                            {renderTransformControls(d, (field, value) => {})}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'objects' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-cyan-300">Scene Objects</h3>
                        <button onClick={() => objectUploadRef.current?.click()} className="bg-cyan-600 px-3 py-1 rounded-md text-sm">Upload GLB</button>
                        <input type="file" ref={objectUploadRef} onChange={handleObjectUpload} accept=".glb" className="hidden" />
                    </div>

                    <div className="bg-gray-700/50 p-3 rounded-md mt-4">
                        <h4 className="text-md font-semibold text-cyan-300 mb-2">Create Primitive</h4>
                        <div className="flex items-center gap-2">
                            <select value={primitiveToAdd} onChange={e => setPrimitiveToAdd(e.target.value as PrimitiveType)} className="w-full bg-gray-800 p-2 rounded-md">
                                <option value="box">Box</option>
                                <option value="sphere">Sphere</option>
                                <option value="cylinder">Cylinder</option>
                            </select>
                            <button onClick={handleAddPrimitive} className="bg-purple-600 px-4 py-2 rounded-md text-sm">Add Primitive</button>
                        </div>
                    </div>

                    {localObjects.map(o => (
                        <div key={o.id} className="bg-gray-700/50 p-3 rounded-md relative">
                            <RemoveButton onClick={() => removeItem('objects', o.id)} />
                            {o.type === 'primitive' ? (
                                <div>
                                    <p className="text-md font-semibold text-cyan-300 capitalize">{o.primitiveType}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                                        {o.primitiveType === 'box' && o.primitiveParameters && (
                                            <>
                                                <SliderInput label="Width" value={o.primitiveParameters.width} onChange={e => handlePrimitiveParamChange(o.id, 'width', Number(e.target.value))} min={1} max={50} step={0.5} />
                                                <SliderInput label="Height" value={o.primitiveParameters.height} onChange={e => handlePrimitiveParamChange(o.id, 'height', Number(e.target.value))} min={1} max={50} step={0.5} />
                                                <SliderInput label="Depth" value={o.primitiveParameters.depth} onChange={e => handlePrimitiveParamChange(o.id, 'depth', Number(e.target.value))} min={1} max={50} step={0.5} />
                                            </>
                                        )}
                                        {o.primitiveType === 'sphere' && o.primitiveParameters && (
                                            <>
                                                <SliderInput label="Radius" value={o.primitiveParameters.radius} onChange={e => handlePrimitiveParamChange(o.id, 'radius', Number(e.target.value))} min={1} max={30} step={0.5} />
                                                <SliderInput label="Width Segments" value={o.primitiveParameters.widthSegments} onChange={e => handlePrimitiveParamChange(o.id, 'widthSegments', Number(e.target.value))} min={3} max={64} step={1} />
                                                <SliderInput label="Height Segments" value={o.primitiveParameters.heightSegments} onChange={e => handlePrimitiveParamChange(o.id, 'heightSegments', Number(e.target.value))} min={2} max={32} step={1} />
                                            </>
                                        )}
                                        {o.primitiveType === 'cylinder' && o.primitiveParameters && (
                                            <>
                                                <SliderInput label="Radius Top" value={o.primitiveParameters.radiusTop} onChange={e => handlePrimitiveParamChange(o.id, 'radiusTop', Number(e.target.value))} min={0.1} max={30} step={0.1} />
                                                <SliderInput label="Radius Bottom" value={o.primitiveParameters.radiusBottom} onChange={e => handlePrimitiveParamChange(o.id, 'radiusBottom', Number(e.target.value))} min={0.1} max={30} step={0.1} />
                                                <SliderInput label="Height" value={o.primitiveParameters.height} onChange={e => handlePrimitiveParamChange(o.id, 'height', Number(e.target.value))} min={1} max={50} step={0.5} />
                                                <SliderInput label="Radial Segments" value={o.primitiveParameters.radialSegments} onChange={e => handlePrimitiveParamChange(o.id, 'radialSegments', Number(e.target.value))} min={3} max={64} step={1} />
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" placeholder="Model URL" value={o.url || ''} onChange={e => handleItemChange(o.id, 'url', e.target.value)} className="w-full bg-gray-800 p-2 rounded-md" />
                                    <select value={o.type} onChange={e => handleItemChange(o.id, 'type', e.target.value)} className="w-full bg-gray-800 p-2 rounded-md">
                                        <option value="model">Model</option>
                                        <option value="hologram">Hologram</option>
                                    </select>
                                </div>
                            )}
                            {renderTransformControls(o, (field, value) => handleItemChange(o.id, field, value))}
                        </div>
                    ))}
                </div>
            )}
            
            {activeTab === 'room' && (
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-cyan-300">Room Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Room Shape</label>
                            <select value={localRoomConfig.shape} onChange={e => handleRoomChange('shape', e.target.value)} className="w-full bg-gray-700 p-2 rounded-md">
                                <option value="sphere">Sphere</option>
                                <option value="box">Box</option>
                                <option value="cylinder">Cylinder</option>
                                <option value="cone">Cone</option>
                                <option value="torus">Torus</option>
                                <option value="icosahedron">Icosahedron</option>
                                <option value="dodecahedron">Dodecahedron</option>
                            </select>
                        </div>
                         <SliderInput label="Size" value={localRoomConfig.size} onChange={e => handleRoomChange('size', Number(e.target.value))} min={50} max={500} step={1} />
                         <div className="flex items-center gap-4">
                            <label className="text-sm text-gray-400">Wall Color</label>
                            <input type="color" value={localRoomConfig.wallColor} onChange={e => handleRoomChange('wallColor', e.target.value)} className="bg-gray-700" />
                        </div>
                         <div className="flex items-center gap-4">
                            <label className="text-sm text-gray-400">Floor Color</label>
                            <input type="color" value={localRoomConfig.floorColor} onChange={e => handleRoomChange('floorColor', e.target.value)} className="bg-gray-700" />
                        </div>
                    </div>

                    <div className="border-t border-gray-700/50 pt-4">
                         <h4 className="text-md font-semibold text-cyan-300 mb-2">Geometry Details</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {localRoomConfig.shape === 'sphere' && (
                                <>
                                    <SliderInput label="Width Segments" value={localRoomConfig.geometryConfig.sphere.widthSegments} onChange={e => handleGeometryChange('sphere', 'widthSegments', Number(e.target.value))} min={3} max={128} step={1} />
                                    <SliderInput label="Height Segments" value={localRoomConfig.geometryConfig.sphere.heightSegments} onChange={e => handleGeometryChange('sphere', 'heightSegments', Number(e.target.value))} min={2} max={128} step={1} />
                                </>
                            )}
                            {localRoomConfig.shape === 'box' && (
                                <>
                                    <SliderInput label="Width Segments" value={localRoomConfig.geometryConfig.box.widthSegments} onChange={e => handleGeometryChange('box', 'widthSegments', Number(e.target.value))} min={1} max={64} step={1} />
                                    <SliderInput label="Height Segments" value={localRoomConfig.geometryConfig.box.heightSegments} onChange={e => handleGeometryChange('box', 'heightSegments', Number(e.target.value))} min={1} max={64} step={1} />
                                    <SliderInput label="Depth Segments" value={localRoomConfig.geometryConfig.box.depthSegments} onChange={e => handleGeometryChange('box', 'depthSegments', Number(e.target.value))} min={1} max={64} step={1} />
                                </>
                            )}
                            {localRoomConfig.shape === 'cylinder' && (
                                <>
                                    <SliderInput label="Radial Segments" value={localRoomConfig.geometryConfig.cylinder.radialSegments} onChange={e => handleGeometryChange('cylinder', 'radialSegments', Number(e.target.value))} min={3} max={128} step={1} />
                                    <SliderInput label="Height Segments" value={localRoomConfig.geometryConfig.cylinder.heightSegments} onChange={e => handleGeometryChange('cylinder', 'heightSegments', Number(e.target.value))} min={1} max={64} step={1} />
                                </>
                            )}
                            {localRoomConfig.shape === 'cone' && (
                                <>
                                    <SliderInput label="Radial Segments" value={localRoomConfig.geometryConfig.cone.radialSegments} onChange={e => handleGeometryChange('cone', 'radialSegments', Number(e.target.value))} min={3} max={128} step={1} />
                                    <SliderInput label="Height Segments" value={localRoomConfig.geometryConfig.cone.heightSegments} onChange={e => handleGeometryChange('cone', 'heightSegments', Number(e.target.value))} min={1} max={64} step={1} />
                                </>
                            )}
                            {localRoomConfig.shape === 'torus' && (
                                <>
                                    <SliderInput label="Radial Segments" value={localRoomConfig.geometryConfig.torus.radialSegments} onChange={e => handleGeometryChange('torus', 'radialSegments', Number(e.target.value))} min={3} max={64} step={1} />
                                    <SliderInput label="Tubular Segments" value={localRoomConfig.geometryConfig.torus.tubularSegments} onChange={e => handleGeometryChange('torus', 'tubularSegments', Number(e.target.value))} min={3} max={128} step={1} />
                                </>
                            )}
                             {(localRoomConfig.shape === 'icosahedron' || localRoomConfig.shape === 'dodecahedron') && (
                                <SliderInput label="Detail" value={localRoomConfig.geometryConfig[localRoomConfig.shape].detail} onChange={e => handleGeometryChange(localRoomConfig.shape, 'detail', Number(e.target.value))} min={0} max={5} step={1} />
                            )}
                         </div>
                    </div>
                    
                    <div className="border-t border-gray-700/50 pt-4">
                         <h4 className="text-md font-semibold text-cyan-300 mb-2">Lighting</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SliderInput label="Ambient Light Intensity" value={localRoomConfig.ambientLightIntensity} onChange={e => handleRoomChange('ambientLightIntensity', Number(e.target.value))} min={0} max={10} step={0.1} />
                            <SliderInput label="Central Point Light Intensity" value={localRoomConfig.pointLightIntensity} onChange={e => handleRoomChange('pointLightIntensity', Number(e.target.value))} min={0} max={50} step={0.5} />
                             <div className="flex items-center gap-4">
                                <label className="text-sm text-gray-400">Point Light Color</label>
                                <input type="color" value={localRoomConfig.pointLightColor} onChange={e => handleRoomChange('pointLightColor', e.target.value)} className="bg-gray-700" />
                            </div>
                         </div>
                    </div>

                     <div className="border-t border-gray-700/50 pt-4">
                         <h4 className="text-md font-semibold text-cyan-300 mb-2">Atmosphere</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SliderInput label="Fog Density" value={localRoomConfig.fogDensity} onChange={e => handleRoomChange('fogDensity', Number(e.target.value))} min={0} max={100} step={1} />
                             <div className="flex items-center gap-4">
                                <label className="text-sm text-gray-400">Fog Color</label>
                                <input type="color" value={localRoomConfig.fogColor} onChange={e => handleRoomChange('fogColor', e.target.value)} className="bg-gray-700" />
                            </div>
                         </div>
                    </div>
                </div>
            )}

            {activeTab === 'generation' && (
                <div className="space-y-6 relative">
                    {isGenerating && (
                        <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center z-10 rounded-lg -m-4">
                            <div className="text-cyan-400 text-lg mb-4 font-semibold">{generationStatus || 'Starting up...'}</div>
                            <div className="w-3/4 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 rounded-full animate-pulse"></div>
                            </div>
                            <p className="text-gray-400 text-sm mt-4">AI is building your world. This can take up to a minute.</p>
                        </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-cyan-300">Universe Generation</h3>
                      <p className="text-sm text-gray-400 mt-1">Describe a theme, and let AI build a complete universe configuration for you.</p>
                       <div className="mt-4">
                           <label className="text-sm text-gray-400 mb-1 block">Gemini API Key</label>
                           <input
                               type="password"
                               value={apiKey}
                               onChange={(e) => onApiKeyChange(e.target.value)}
                               placeholder="Enter your key to enable generation..."
                               className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                               autoComplete="off"
                           />
                       </div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Theme Prompt</label>
                        <textarea
                            value={generationPrompt}
                            onChange={(e) => setGenerationPrompt(e.target.value)}
                            placeholder="e.g., An ancient, overgrown elven library."
                            className="w-full h-24 bg-gray-800 border border-gray-600 rounded-md p-2"
                        />
                    </div>
                    <button onClick={handleGenerateRoom} disabled={isGenerating || !apiKey} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50">
                        {isGenerating ? 'Generating...' : 'Generate Universe'}
                    </button>
                    {generationError && <p className="text-red-400 text-sm text-center">{generationError}</p>}
                    
                    <div className="border-t border-cyan-500/30 pt-4 mt-4 space-y-3">
                        <h4 className="text-md font-semibold text-cyan-300">Community Models</h4>
                        <p className="text-sm text-gray-400">Or, add a single model from the community to your scene.</p>
                        
                        {isLoadingModels && <p className="text-gray-400">Loading models...</p>}
                        {modelsError && <p className="text-red-400 text-sm">Error: {modelsError}</p>}
                        
                        {!isLoadingModels && !modelsError && (
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedCommunityModelUrl}
                                    onChange={(e) => setSelectedCommunityModelUrl(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-sm flex-grow"
                                    aria-label="Select a community model"
                                >
                                    <option value="">-- Select a model from public Gists --</option>
                                    {communityModels.map((model, index) => (
                                        <option key={`${model.url}-${index}`} value={model.url}>
                                            {model.description || `Community Model #${index + 1}`}
                                        </option>
                                    ))}
                                </select>
                                <button 
                                    onClick={handleAddCommunityModel} 
                                    disabled={!selectedCommunityModelUrl}
                                    className="bg-cyan-600 hover:bg-cyan-500 px-3 py-2 rounded-md text-sm text-white font-semibold disabled:opacity-50 flex-shrink-0"
                                >
                                    Add to Scene
                                </button>
                            </div>
                        )}
                    </div>

                    {generatedConfig && (
                        <div className="border-t border-cyan-500/30 pt-4 mt-4 space-y-3">
                            <h4 className="text-md font-semibold text-cyan-300">Generation Complete!</h4>
                            <p className="text-sm text-gray-300">A new configuration has been created based on your prompt. You can now save it or apply it to the scene.</p>
                             <div className="flex gap-4">
                                <button onClick={() => onLoadConfiguration(generatedConfig)} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                    Load Generated Scene
                                </button>
                                <button onClick={handleSaveConfig} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                    Save to File
                                </button>
                             </div>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'inspector' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-cyan-300">Code Inspector</h3>
                    <p className="text-sm text-gray-400">
                        Select a source file to view its content on the main screen and ask MOOSE-BOT questions about it.
                    </p>
                    <div>
                        <label htmlFor="source-file-select" className="text-sm text-gray-400 mb-1 block">Select Source File</label>
                        <select
                            id="source-file-select"
                            value={selectedSourceFile}
                            onChange={e => setSelectedSourceFile(e.target.value)}
                            className="w-full bg-gray-700 p-2 rounded-md"
                        >
                            <option value="" disabled>-- Choose a file --</option>
                            {sourceFiles.map(file => (
                                <option key={file} value={file}>{file}</option>
                            ))}
                        </select>
                    </div>
                     <p className="text-xs text-gray-500 mt-2">
                        After selecting a file, try asking MOOSE-BOT: "What does this code do?" or "Explain the 'Room' component in this file."
                    </p>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-cyan-300">Manage Configuration</h3>
                    <div className="flex gap-4">
                        <button onClick={handleSaveConfig} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Save to File</button>
                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Load from File</button>
                        <input type="file" ref={fileInputRef} onChange={handleFileLoad} accept=".json" className="hidden" />
                    </div>
                </div>
            )}
        </div>
        
        <div className="flex justify-end pt-4 border-t border-gray-700 flex-shrink-0">
          <button onClick={handleApplyChanges} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-md transition-colors">
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
