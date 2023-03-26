import { getMediaSessionCover } from '../../../utils/misc'
import { RepeatMode, Site, StateMode } from '../../types'
import { querySelector, querySelectorEventReport, querySelectorReport } from '../selectors'
import { ContentUtils, ratingUtils } from '../utils'

let lastVolume = 100

const site: Site = {
  init: () => {
    setInterval(async () => {
      lastVolume = await ContentUtils.getYouTubeMusicVolume() ?? 100
    }, ContentUtils.getSettings().updateFrequencyMs2 / 2)
  },
  ready: () =>
    navigator.mediaSession.metadata !== null
    && querySelector<boolean, HTMLElement>('video', (el) => true, false),
  info: {
    player: () => 'YouTube Music',
    state: () => querySelectorReport<StateMode, HTMLVideoElement>('video', (el) => (el.paused ? StateMode.PAUSED : StateMode.PLAYING), StateMode.PAUSED, 'state'),
    title: () => navigator.mediaSession.metadata?.title || '',
    artist: () => navigator.mediaSession.metadata?.artist || '',
    album: () => navigator.mediaSession.metadata?.album || '',
    cover: () => getMediaSessionCover(),
    duration: () => querySelectorReport<string, HTMLElement>('.time-info.ytmusic-player-bar', (el) => el.innerText.split(' / ')[1], '0:00', 'duration'),
    position: () => querySelectorReport<string, HTMLElement>('.time-info.ytmusic-player-bar', (el) => el.innerText.split(' / ')[0], '0:00', 'position'),
    volume: () => lastVolume,
    rating: () => {
      const likeButtonPressed = querySelectorReport<boolean, HTMLButtonElement>('(.middle-controls-buttons yt-button-shape)[1]', (el) => el.getAttribute('aria-pressed') === 'true', false, 'rating')
      if (likeButtonPressed) return 5
      const dislikeButtonPressed = querySelectorReport<boolean, HTMLButtonElement>('.middle-controls-buttons yt-button-shape', (el) => el.getAttribute('aria-pressed') === 'true', false, 'rating')
      if (dislikeButtonPressed) return 1
      return 0
    },
    repeat: () => querySelectorReport<RepeatMode, HTMLElement>('ytmusic-player-bar', (el) => {
      const repeatMode = el.getAttribute('repeat-mode_')
      if (repeatMode === 'ALL') return RepeatMode.ALL
      if (repeatMode === 'ONE') return RepeatMode.ONE
      return RepeatMode.NONE
    }, RepeatMode.NONE, 'repeat'),
    // YouTube music doesn't do shuffling the traditional way, it just shuffles the current queue with no way of undoing it
    shuffle: () => false
  },
  events: {
    togglePlaying: () => querySelectorEventReport<HTMLButtonElement>('#play-pause-button', (el) => el.click(), 'togglePlaying'),
    next: () => querySelectorEventReport<HTMLButtonElement>('.next-button', (el) => el.click(), 'next'),
    previous: () => querySelectorEventReport<HTMLButtonElement>('.previous-button', (el) => el.click(), 'previous'),
    setPositionSeconds: null,
    setPositionPercentage: (positionPercentage: number) => {
      querySelectorEventReport<HTMLElement>('#progress-bar tp-yt-paper-progress', (el) => {
        const loc = el.getBoundingClientRect()
        const position = positionPercentage * loc.width

        el.dispatchEvent(new MouseEvent('mousedown', {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: loc.left + position,
          clientY: loc.top + (loc.height / 2)
        }))
        el.dispatchEvent(new MouseEvent('mouseup', {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: loc.left + position,
          clientY: loc.top + (loc.height / 2)
        }))
      }, 'setPositionPercentage')
    },
    setVolume: (volume: number) => {
      ContentUtils.setYouTubeMusicVolume(volume)
      lastVolume = volume
    },
    toggleRepeat: () => querySelectorEventReport<HTMLButtonElement>('.repeat', (el) => el.click(), 'toggleRepeat'),
    toggleShuffle: () => querySelectorEventReport<HTMLButtonElement>('.shuffle', (el) => el.click(), 'toggleShuffle'),
    toggleThumbsUp: () => querySelectorEventReport<HTMLButtonElement>('(.middle-controls-buttons button)[1]', (el) => el.click(), 'toggleThumbsUp'),
    toggleThumbsDown: () => querySelectorEventReport<HTMLButtonElement>('.middle-controls-buttons button', (el) => el.click(), 'toggleThumbsDown'),
    setRating: (rating: number) => ratingUtils.likeDislike(site, rating)
  }
}

export default site