import type { Headphone, Song, ThemeId, HeadphoneSignature, CustomCategoryDef, FilterMode } from '../data/types';
import { useTheme } from './ThemeContext';
import { CategoryBadgeGroup } from './CategoryBadge';

interface Props {
  headphones: Headphone[];
  songs: Song[];
  selectedIndex: number;
  onSelectSong: (index: number) => void;
  hpSignatures: Record<string, HeadphoneSignature>;
  customCategories: CustomCategoryDef[];
  filterMode: FilterMode;
  onChangeFilterMode: (mode: FilterMode) => void;
  onOpenHpModal: (hp: Headphone) => void;
  onOpenSignatureManager: () => void;
  onOpenAddModal: () => void;
  onRemoveHeadphone: (id: string) => void;
}

const themes: { id: ThemeId; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'igor', label: 'IGOR' },
  { id: 'in-rainbows', label: 'In Rainbows' },
  { id: 'yellow-submarine', label: 'Yellow Submarine' },
  { id: 'kid-a', label: 'Kid A' },
];

export default function Sidebar({ headphones, songs, selectedIndex, onSelectSong, hpSignatures, customCategories, filterMode, onChangeFilterMode, onOpenHpModal, onOpenSignatureManager, onOpenAddModal, onRemoveHeadphone }: Props) {
  const { themeId, setThemeId } = useTheme();

  return (
    <nav className="sidebar" data-testid="main-sidebar">
      <div className="sidebar-label">liked songs ({songs.length})</div>
      <div className="song-list" data-testid="song-list">
        {songs.map((song, i) => (
          <button
            key={song.id ?? i}
            className={`song-list-item${i === selectedIndex ? ' active' : ''}`}
            onClick={() => onSelectSong(i)}
          >
            {song.albumArtUrl ? (
              <img
                className="song-list-art"
                src={song.albumArtUrl}
                alt=""
                loading="lazy"
              />
            ) : (
              <span className="song-list-art song-list-art-emoji">{song.albumArtEmoji}</span>
            )}
            <span className="song-list-info">
              <span className="song-list-title">{song.title}</span>
              <span className="song-list-artist">{song.artist}</span>
            </span>
          </button>
        ))}
      </div>

      <hr className="divider" />

      <div className="sidebar-label">my gear</div>
      {headphones.map((hp) => (
        <div
          className="collection-item collection-item-clickable"
          key={hp.id}
          onClick={() => onOpenHpModal(hp)}
          title="Click to set headphone signature"
        >
          <span className={`hp-dot ${hp.dotColor}`} />
          {hp.name}
          {hpSignatures[hp.id] && (
            <CategoryBadgeGroup
              primary={hpSignatures[hp.id].category}
              secondary={hpSignatures[hp.id].secondaryCategories}
              customCategories={customCategories}
            />
          )}
          <span className="hp-type">{hp.specs}</span>
          <button
            className="collection-item-remove"
            onClick={(e) => { e.stopPropagation(); onRemoveHeadphone(hp.id); }}
            title="Remove from collection"
            aria-label={`Remove ${hp.name}`}
          >
            &times;
          </button>
        </div>
      ))}

      <div className="sidebar-manage" onClick={onOpenSignatureManager}>
        Manage Signatures
      </div>

      <div className="filter-toggle">
        <span className="filter-toggle-label">Filter:</span>
        <div className="filter-segmented">
          <button
            className={`filter-seg-btn${filterMode === 'precise' ? ' active' : ''}`}
            onClick={() => onChangeFilterMode('precise')}
          >
            Match
          </button>
          <button
            className={`filter-seg-btn${filterMode === 'ballpark' ? ' active' : ''}`}
            onClick={() => onChangeFilterMode('ballpark')}
          >
            Explore
          </button>
        </div>
      </div>

      <hr className="divider" />
      <div className="add-hp" data-testid="add-headphone-btn" onClick={onOpenAddModal}>
        Add Headphone
      </div>

      <hr className="divider" />
      <div className="sidebar-label">theme</div>
      <div className="theme-picker" data-testid="theme-picker">
        {themes.map((t) => (
          <button
            key={t.id}
            className={`theme-swatch${themeId === t.id ? ' active' : ''}`}
            data-swatch={t.id}
            onClick={() => setThemeId(t.id)}
            title={t.label}
            aria-label={`Switch to ${t.label} theme`}
            data-testid={`theme-swatch-${t.id}`}
          />
        ))}
      </div>
    </nav>
  );
}
