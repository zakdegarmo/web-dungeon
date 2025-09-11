
import React, { useRef, useState, useEffect } from 'react';

// --- INLINED DEPENDENCIES ---

// From types.ts
export interface UnityHubPanelProps {
  className?: string;
}

// From components/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  ...props
}) => {
  const baseStyles = 'flex items-center justify-center space-x-2 px-4 py-3 rounded-md font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-cyan-600 text-white hover:bg-cyan-500 focus:ring-cyan-500',
    secondary: 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// From components/icons.tsx
interface IconProps extends React.SVGProps<SVGSVGElement> {
    title?: string;
}

const GlobeIcon: React.FC<IconProps> = ({ className, title, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.705 4.337A9 9 0 0119.663 7.705M16.295 19.663A9 9 0 014.337 16.295" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
    </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M23 12a9 9 0 11-2.638-6.362" />
    </svg>
);

const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
    </svg>
);

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

const InfoIcon: React.FC<IconProps> = ({ className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6 text-cyan-400"} viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);


// --- MAIN COMPONENT ---

// Define the state for a single tab, including its navigation history
interface TabState {
  title: string;
  history: string[];
  currentIndex: number;
}


export const UnityHubPanel: React.FC<UnityHubPanelProps> = ({ className }) => {
  // Use a unique ID (the initial URL) to key the tabs state object
  const [tabs, setTabs] = useState<Record<string, TabState>>({});
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [addressBarUrl, setAddressBarUrl] = useState('');
  const [error, setError] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tabId: string } | null>(null);
  const [showWarning, setShowWarning] = useState(true);
  const screenIdRef = useRef<string | null>(null);
  const isInitialLoad = useRef(true);

  const activeTab = activeTabId ? tabs[activeTabId] : null;
  
  // Setup communication with parent window (MOOSE app)
  useEffect(() => {
    // 1. Identify self by parsing screenId from URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('screenId');
    if (id) {
        screenIdRef.current = id;
    }

    // 2. Listen for messages from the parent
    const handleMessage = (event: MessageEvent) => {
        // A basic security check for origin could be added here if needed
        const { type, payload } = event.data;
        if (type === 'RESTORE_STATE' && payload.state) {
            isInitialLoad.current = false; // Don't save state on the first render after restoring
            setTabs(payload.state.tabs || {});
            setActiveTabId(payload.state.activeTabId || null);
        }
    };
    window.addEventListener('message', handleMessage);

    // 3. Announce readiness to the parent to receive state
    if (screenIdRef.current) {
        window.parent.postMessage({
            type: 'IFRAME_READY',
            payload: { screenId: screenIdRef.current }
        }, '*'); // Use a specific origin in production
    }

    return () => {
        window.removeEventListener('message', handleMessage);
    }
  }, []);

  // Effect to save state back to parent whenever it changes
  useEffect(() => {
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return; // Don't save initial empty state
    }
    
    if (screenIdRef.current) {
        const stateToSave = { tabs, activeTabId };
         window.parent.postMessage({
            type: 'SAVE_IFRAME_STATE',
            payload: { screenId: screenIdRef.current, state: stateToSave }
        }, '*'); // Use a specific origin in production
    }
  }, [tabs, activeTabId]);


  // Sync the address bar with the active tab's current URL
  useEffect(() => {
    if (activeTab) {
      setAddressBarUrl(activeTab.history[activeTab.currentIndex]);
    } else {
      setAddressBarUrl('');
    }
  }, [activeTab]);


  const handleAddIntegration = () => {
    setError('');
    if (!newTitle.trim() || !newUrl.trim()) {
      setError('Title and URL are required.');
      return;
    }
    let correctedUrl = newUrl;
    if (!/^https?:\/\//i.test(newUrl)) {
      correctedUrl = 'https://' + newUrl;
    }


    const tabId = correctedUrl; // Use URL as the unique ID
    if (tabs[tabId]) {
      // If tab exists, just switch to it
      setActiveTabId(tabId);
    } else {
      // Otherwise, create a new tab
      setTabs(prev => ({
        ...prev,
        [tabId]: {
          title: newTitle,
          history: [correctedUrl],
          currentIndex: 0,
        },
      }));
      setActiveTabId(tabId);
    }
    setNewTitle('');
    setNewUrl('');
  };

  const handleRemoveIntegration = (tabId: string) => {
    setTabs(prev => {
      const newTabs = { ...prev };
      delete newTabs[tabId];
      
      // If the active tab is removed, switch to another tab or clear active state
      if (activeTabId === tabId) {
        const remainingTabIds = Object.keys(newTabs);
        setActiveTabId(remainingTabIds.length > 0 ? remainingTabIds[0] : null);
      }
      return newTabs;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  };
  
  const handleRemoveFromContext = () => {
      if (contextMenu) {
          handleRemoveIntegration(contextMenu.tabId);
          setContextMenu(null);
      }
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);


  // --- Navigation Handlers ---

  const navigate = (tabId: string, newUrlValue: string) => {
    setTabs(prev => {
      const tab = prev[tabId];
      if (!tab) return prev;
      
      let correctedUrl = newUrlValue;
      if (!/^https?:\/\//i.test(newUrlValue)) {
        correctedUrl = 'https://' + newUrlValue;
      }

      // Truncate history if we are navigating from a 'back' state
      const newHistory = tab.history.slice(0, tab.currentIndex + 1);
      newHistory.push(correctedUrl);

      return {
        ...prev,
        [tabId]: {
          ...tab,
          history: newHistory,
          currentIndex: newHistory.length - 1,
        }
      };
    });
  };

  const handleAddressBarSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && activeTabId) {
      const newUrlValue = (e.target as HTMLInputElement).value;
      if (newUrlValue) {
          navigate(activeTabId, newUrlValue);
      }
    }
  };
  
  const handleNavBack = () => {
    if (!activeTabId || !activeTab) return;
    if (activeTab.currentIndex > 0) {
      setTabs(prev => ({
        ...prev,
        [activeTabId]: {
          ...activeTab,
          currentIndex: activeTab.currentIndex - 1,
        }
      }));
    }
  };

  const handleNavForward = () => {
    if (!activeTabId || !activeTab) return;
    if (activeTab.currentIndex < activeTab.history.length - 1) {
      setTabs(prev => ({
        ...prev,
        [activeTabId]: {
          ...activeTab,
          currentIndex: activeTab.currentIndex + 1,
        }
      }));
    }
  };

  const handleNavRefresh = () => {
    const iframe = activeTabId ? iframeRefs.current[activeTabId] : null;
    if (iframe) {
      // Force reload by changing the src property slightly, then changing back.
      // A more direct reload can be blocked by cross-origin policies.
      iframe.src = iframe.src;
    }
  };

  const handleNavHome = () => {
    if (!activeTabId || !activeTab) return;
    // Navigate to the first URL in the history for that tab
    setTabs(prev => ({
      ...prev,
      [activeTabId]: {
        ...activeTab,
        currentIndex: 0,
      }
    }));
  };

  // --- Render ---

  const canGoBack = activeTab ? activeTab.currentIndex > 0 : false;
  const canGoForward = activeTab ? activeTab.currentIndex < activeTab.history.length - 1 : false;

  return (
    <div className={`w-full h-full flex flex-col bg-gray-900 ${className || ''}`.trim()}>
      <header className="flex-shrink-0 p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-cyan-300 flex items-center space-x-3">
            <GlobeIcon className="h-6 w-6 text-cyan-400" />
            <span>Unity Hub</span>
        </h2>
        <p className="text-xs text-gray-400">Integrated web applications</p>
      </header>
      <div className="p-3 border-b border-gray-700 bg-gray-800/50 space-y-2">
          <input 
              type="text" 
              value={newTitle} 
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Label for new tab"
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
              aria-label="New integration title"
          />
          <div className="flex items-center space-x-2">
            <input 
                type="url" 
                value={newUrl} 
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="URL (e.g., wikipedia.org)"
                className="flex-grow bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                aria-label="New integration URL"
            />
            <Button onClick={handleAddIntegration} className="!py-1.5" disabled={!newTitle.trim() || !newUrl.trim()}>
                Add
            </Button>
          </div>
          {error && <p className="text-xs text-red-400 mt-1 px-1">{error}</p>}
      </div>
      
      <div className="flex-shrink-0 flex items-center border-b border-gray-700 overflow-x-auto">
        {Object.entries(tabs).map(([tabId, tab]) => (
          <button
            key={tabId}
            onClick={() => setActiveTabId(tabId)}
            onContextMenu={(e) => handleContextMenu(e, tabId)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTabId === tabId
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-gray-400 hover:bg-gray-800/50'
            }`}
            aria-current={activeTabId === tabId ? 'page' : undefined}
          >
            {tab.title}
          </button>
        ))}
      </div>
      
      {activeTabId && (
        <div className="flex-shrink-0 flex items-center px-2 py-1 border-b border-gray-700 bg-gray-800/50 space-x-1 text-gray-400">
          <button onClick={handleNavBack} aria-label="Back" title="Back" className="p-1.5 rounded hover:bg-gray-800/50 transition-colors disabled:opacity-50" disabled={!canGoBack}>
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <button onClick={handleNavForward} aria-label="Forward" title="Forward" className="p-1.5 rounded hover:bg-gray-800/50 transition-colors disabled:opacity-50" disabled={!canGoForward}>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
          <button onClick={handleNavRefresh} aria-label="Refresh" title="Refresh" className="p-1.5 rounded hover:bg-gray-800/50 transition-colors disabled:opacity-50">
            <RefreshIcon className="h-4 w-4" />
          </button>
          <button onClick={handleNavHome} aria-label="Home" title="Home" className="p-1.5 rounded hover:bg-gray-800/50 transition-colors disabled:opacity-50">
            <HomeIcon className="h-4 w-4" />
          </button>
          <input
            type="text"
            value={addressBarUrl}
            onChange={(e) => setAddressBarUrl(e.target.value)}
            onKeyDown={handleAddressBarSubmit}
            className="flex-grow bg-gray-800 border border-gray-600 rounded-md px-2 py-0.5 text-sm mx-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            aria-label="Current URL"
            title="Current URL"
          />
        </div>
      )}
      
      {showWarning && Object.keys(tabs).length > 0 && (
        <div className="flex-shrink-0 p-2 text-xs bg-yellow-900/50 text-yellow-200 flex items-start space-x-2 border-b border-gray-700">
          <InfoIcon className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="flex-grow">
            Note: Some websites (like Google) block being embedded. If a tab appears blank, it's likely due to the site's own security policy, not a bug.
          </span>
          <button onClick={() => setShowWarning(false)} className="font-bold text-lg leading-none px-1">&times;</button>
        </div>
      )}


      <div className="flex-grow relative bg-gray-800">
        {Object.keys(tabs).length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-400 p-4">
            <GlobeIcon className="h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-cyan-300">No integrations added</h3>
            <p className="text-sm">Use the form above to add a web page as a new tab.</p>
          </div>
        )}
        {Object.entries(tabs).map(([tabId, tab]) => (
          <iframe
            key={tabId}
            ref={el => { iframeRefs.current[tabId] = el; }}
            src={tab.history[tab.currentIndex]}
            title={tab.title}
            className="absolute top-0 left-0 w-full h-full border-none"
            style={{
              visibility: activeTabId === tabId ? 'visible' : 'hidden',
            }}
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          />
        ))}
      </div>
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="absolute z-50 bg-gray-800 border border-gray-600 rounded-md shadow-lg p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handleRemoveFromContext} className="w-full text-left px-3 py-1 text-sm text-red-400 hover:bg-red-500/20 rounded-sm transition-colors">
            Remove
          </button>
        </div>
      )}
    </div>
  );
};
