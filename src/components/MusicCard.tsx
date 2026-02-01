import type { Music } from '../types/halapi';

interface MusicCardProps {
  music: Music;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MusicCard({ music }: MusicCardProps) {
  const isAlbum = music.type === 'album';

  return (
    <div className="artifact-card music-card">
      {music.coverUrl && (
        <img
          src={music.coverUrl}
          alt={music.title}
          className="artifact-cover"
        />
      )}
      <div className="artifact-info">
        <span className="artifact-type-badge">
          {isAlbum ? 'Album' : 'Track'}
        </span>
        <strong className="artifact-title">{music.title}</strong>
        <span className="artifact-author">{music.artist}</span>
        {music.year && <span className="artifact-year">({music.year})</span>}

        {isAlbum && music.label && (
          <span className="artifact-label">Label: {music.label}</span>
        )}

        {!isAlbum && music.album && (
          <span className="artifact-album">Album: {music.album}</span>
        )}

        {!isAlbum && music.duration && (
          <span className="artifact-duration">
            {formatDuration(music.duration)}
          </span>
        )}

        {isAlbum && music.tracks && music.tracks.length > 0 && (
          <div className="artifact-tracks">
            <span className="tracks-header">Tracks:</span>
            <ul>
              {music.tracks.slice(0, 5).map((track, i) => (
                <li key={i}>
                  {track.title}
                  {track.duration && (
                    <span className="track-duration">
                      {formatDuration(track.duration)}
                    </span>
                  )}
                </li>
              ))}
              {music.tracks.length > 5 && (
                <li className="more-tracks">
                  +{music.tracks.length - 5} more tracks
                </li>
              )}
            </ul>
          </div>
        )}

        {isAlbum && music.genres && music.genres.length > 0 && (
          <div className="artifact-tags">
            {music.genres.map((genre, i) => (
              <span key={i} className="artifact-tag">
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
