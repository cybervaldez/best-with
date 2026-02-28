import type { Song, SongSignature } from '../data/types';

interface Props {
  song: Song;
  signature: SongSignature | null;
  onGetSignature: () => void;
}

export default function SongHeader({ song, signature, onGetSignature }: Props) {
  return (
    <div className="song-header" data-testid="song-header">
      <div className="album-art-wrapper">
        <div className="album-art-glow" />
        <div className="album-art" data-testid="album-art">
          {song.albumArtUrl ? (
            <img src={song.albumArtUrl} alt={`${song.title} album art`} />
          ) : (
            song.albumArtEmoji
          )}
        </div>
      </div>
      <div className="song-info">
        <div className="song-title">{song.title}</div>
        <div className="song-artist">
          {song.artist} {'\u00B7'} {song.album}
        </div>
        <div className="song-tags">
          {song.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        {!signature && song.id && (
          <button className="btn-get-signature" onClick={onGetSignature}>
            Get Sound Signature
          </button>
        )}
      </div>
    </div>
  );
}
