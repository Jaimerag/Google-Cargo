import { useState, KeyboardEvent } from 'react';
import { IconButton } from '@mui/material';
import { Search, LocalShipping, Menu } from '@mui/icons-material';

interface Props {
  onOpen: () => void;     // Opens the sidebar to set destination
  sidebarOpen: boolean;
}

export default function SearchBar({ onOpen, sidebarOpen }: Props) {
  const [query, setQuery] = useState('');

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) onOpen();
  };

  return (
    <div className={`gc-searchbar${sidebarOpen ? ' sidebar-open' : ''}`}>
      <LocalShipping sx={{ color: '#1a73e8', fontSize: 22, flexShrink: 0 }} />
      <input
        placeholder="Buscar destino de carga…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={onOpen}
        onKeyDown={handleKey}
      />
      <IconButton size="small" onClick={onOpen} sx={{ flexShrink: 0 }}>
        <Search fontSize="small" sx={{ color: '#5f6368' }} />
      </IconButton>
    </div>
  );
}
