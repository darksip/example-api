import type { Music } from '../types/halapi'

interface MusicCardProps {
  music: Music
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function MusicCard({ music }: MusicCardProps) {
  const isAlbum = music.type === 'album'

  // Get cover URL (handle multiple possible fields)
  const getCoverUrl = (): string | undefined => {
    if (isAlbum) {
      return music.coverUrl
    }
    return music.imageUrl || music.albumImageUrl || music.coverUrl
  }

  // Get title (handle 'track' field for tracks)
  const getTitle = (): string => {
    if (!isAlbum && music.track) {
      return music.track
    }
    return music.title
  }

  // Get artist name (handle multiple possible fields)
  const getArtist = (): string => {
    if (!isAlbum) {
      return music.artist_name || music.artiste || music.artist
    }
    return music.artist
  }

  // Get album name for tracks
  const getAlbumName = (): string | undefined => {
    if (!isAlbum) {
      return music.album_name || music.album
    }
    return undefined
  }

  // Get duration (handle 'timing' field)
  const getDuration = (): number | undefined => {
    if (!isAlbum) {
      return music.timing || music.duration
    }
    return undefined
  }

  // Get year from street_date if available
  const getYear = (): number | string | undefined => {
    if (!isAlbum && music.street_date) {
      return music.street_date.substring(0, 4)
    }
    return music.year
  }

  const coverUrl = getCoverUrl()
  const title = getTitle()
  const artist = getArtist()
  const albumName = getAlbumName()
  const duration = getDuration()
  const year = getYear()

  return (
    <div className="artifact-card music-card">
      {coverUrl && <img src={coverUrl} alt={title} className="artifact-cover" />}
      <div className="artifact-info">
        <span className="artifact-type-badge">{isAlbum ? 'Album' : 'Track'}</span>
        <strong className="artifact-title">{title}</strong>
        <span className="artifact-author">{artist}</span>
        {year && <span className="artifact-year">({year})</span>}

        {isAlbum && music.label && <span className="artifact-label">Label: {music.label}</span>}

        {!isAlbum && music.label && <span className="artifact-label">Label: {music.label}</span>}

        {albumName && <span className="artifact-album">Album: {albumName}</span>}

        {!isAlbum && music.num_track && music.num_disc && (
          <span className="artifact-track-info">
            Disc {music.num_disc}, Track {music.num_track}
          </span>
        )}

        {duration && <span className="artifact-duration">{formatDuration(duration)}</span>}

        {isAlbum && music.tracks && music.tracks.length > 0 && (
          <div className="artifact-tracks">
            <span className="tracks-header">Tracks:</span>
            <ul>
              {music.tracks.slice(0, 5).map((track, i) => (
                <li key={i}>
                  {track.title}
                  {track.duration && (
                    <span className="track-duration">{formatDuration(track.duration)}</span>
                  )}
                </li>
              ))}
              {music.tracks.length > 5 && (
                <li className="more-tracks">+{music.tracks.length - 5} more tracks</li>
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
  )
}
