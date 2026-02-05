import type { Music, MusicAlbum, MusicTrackItem } from '../../halapi-js/src'

interface MusicCardProps {
  music: Music
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function isAlbum(music: Music): music is MusicAlbum {
  return music.type === 'album'
}

function AlbumCard({ album }: { album: MusicAlbum }) {
  const coverUrl = album.imageUrl ?? album.albumImageUrl ?? album.coverUrl
  const title = album.album ?? album.title ?? 'Unknown Album'
  const artist = album.artist_name ?? album.artiste ?? album.artist ?? 'Unknown Artist'
  const year = album.street_date?.substring(0, 4) ?? album.year

  return (
    <div className="artifact-card music-card">
      {coverUrl && <img src={coverUrl} alt={title} className="artifact-cover" />}
      <div className="artifact-info">
        <span className="artifact-type-badge">Album</span>
        <strong className="artifact-title">{title}</strong>
        <span className="artifact-author">{artist}</span>
        {year && <span className="artifact-year">({year})</span>}
        {album.label && <span className="artifact-label">Label: {album.label}</span>}

        {album.tracks && album.tracks.length > 0 && (
          <div className="artifact-tracks">
            <span className="tracks-header">Tracks:</span>
            <ul>
              {album.tracks.slice(0, 5).map((track) => (
                <li key={track.title}>
                  {track.title}
                  {track.duration && (
                    <span className="track-duration">{formatDuration(track.duration)}</span>
                  )}
                </li>
              ))}
              {album.tracks.length > 5 && (
                <li className="more-tracks">+{album.tracks.length - 5} more tracks</li>
              )}
            </ul>
          </div>
        )}

        {album.genres && album.genres.length > 0 && (
          <div className="artifact-tags">
            {album.genres.map((genre) => (
              <span key={genre} className="artifact-tag">
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TrackCard({ track }: { track: MusicTrackItem }) {
  const coverUrl = track.imageUrl ?? track.albumImageUrl ?? track.coverUrl
  const title = track.track ?? track.title
  const artist = track.artist_name ?? track.artiste ?? track.artist
  const albumName = track.album_name ?? track.album
  const duration = track.timing ?? track.duration
  const year = track.street_date?.substring(0, 4) ?? track.year

  return (
    <div className="artifact-card music-card">
      {coverUrl && <img src={coverUrl} alt={title} className="artifact-cover" />}
      <div className="artifact-info">
        <span className="artifact-type-badge">Track</span>
        <strong className="artifact-title">{title}</strong>
        <span className="artifact-author">{artist}</span>
        {year && <span className="artifact-year">({year})</span>}
        {track.label && <span className="artifact-label">Label: {track.label}</span>}
        {albumName && <span className="artifact-album">Album: {albumName}</span>}
        {track.num_track && track.num_disc && (
          <span className="artifact-track-info">
            Disc {track.num_disc}, Track {track.num_track}
          </span>
        )}
        {duration && <span className="artifact-duration">{formatDuration(duration)}</span>}
      </div>
    </div>
  )
}

export function MusicCard({ music }: MusicCardProps) {
  if (isAlbum(music)) {
    return <AlbumCard album={music} />
  }
  return <TrackCard track={music} />
}
