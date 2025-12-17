import React, { useState, useEffect } from 'react';
import AdminPanel from './components/AdminPanel';
import ArenaBoard from './components/ArenaBoard';
import { Picker, ThemeId } from './types';
import { INITIAL_DATA } from './constants';

function App() {
  const [view, setView] = useState<'admin' | 'arena'>('admin');
  const [data, setData] = useState<Picker[]>(() => {
    // Try to load from local storage
    const saved = localStorage.getItem('yg-data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  
  const [siteName, setSiteName] = useState(() => localStorage.getItem('yg-site') || 'Distribution Center 1');
  const [themeId, setThemeId] = useState<ThemeId>(() => (localStorage.getItem('yg-theme') as ThemeId) || 'yg');
  const [globalTarget, setGlobalTarget] = useState(() => Number(localStorage.getItem('yg-global-target')) || 5000);
  const [customLogo, setCustomLogo] = useState(() => localStorage.getItem('yg-custom-logo') || '');

  // Persistence
  useEffect(() => {
    localStorage.setItem('yg-data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('yg-site', siteName);
  }, [siteName]);

  useEffect(() => {
    localStorage.setItem('yg-theme', themeId);
  }, [themeId]);

  useEffect(() => {
    localStorage.setItem('yg-global-target', globalTarget.toString());
  }, [globalTarget]);

  useEffect(() => {
    localStorage.setItem('yg-custom-logo', customLogo);
  }, [customLogo]);

  return (
    <div className="min-h-screen">
      {view === 'admin' ? (
        <AdminPanel 
          data={data} 
          setData={setData}
          siteName={siteName}
          setSiteName={setSiteName}
          themeId={themeId}
          setThemeId={setThemeId}
          globalTarget={globalTarget}
          setGlobalTarget={setGlobalTarget}
          customLogo={customLogo}
          setCustomLogo={setCustomLogo}
          onPublish={() => setView('arena')}
        />
      ) : (
        <ArenaBoard 
          data={data}
          siteName={siteName}
          themeId={themeId}
          globalTarget={globalTarget}
          customLogo={customLogo}
          onBack={() => setView('admin')}
        />
      )}
    </div>
  );
}

export default App;