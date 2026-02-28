import { useEffect, useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { fetchLikedSongs, type SpotifyTrack } from './auth/spotify';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import { headphones, experiences } from './data/mock';
import { Song } from './data/types';

function trackToSong(track: SpotifyTrack): Song {
  const art = track.album.images.find((i) => i.width === 300)
    ?? track.album.images[0];
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    album: track.album.name,
    albumArtUrl: art?.url,
    albumArtEmoji: '\u{1F3B5}',
    tags: [],
  };
}

export default function App() {
  const { status, token } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (window as any).appState = {
      view: status === 'authenticated' ? 'home' : 'login',
      initialized: true,
    };
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated' || !token) return;
    setLoading(true);
    fetchLikedSongs(token)
      .then((data) => {
        const mapped = data.items.map((item) => trackToSong(item.track));
        setSongs(mapped);
        setSelectedIndex(0);
      })
      .catch((err) => console.error('Failed to fetch liked songs:', err))
      .finally(() => setLoading(false));
  }, [status, token]);

  if (status === 'loading') {
    return null;
  }

  if (status === 'unauthenticated') {
    return <LoginPage />;
  }

  const selectedSong = songs[selectedIndex];

  if (loading || !selectedSong) {
    return (
      <div className="login-page">
        <div className="login-content">
          <div className="login-title">Loading your liked songs...</div>
        </div>
      </div>
    );
  }

  return (
    <Layout
      song={selectedSong}
      songs={songs}
      selectedIndex={selectedIndex}
      onSelectSong={setSelectedIndex}
      experiences={experiences}
      headphones={headphones}
    />
  );
}
