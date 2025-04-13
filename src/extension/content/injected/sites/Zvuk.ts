import { getMediaSessionCover } from "../../../../utils/misc";
import { EventError, Repeat, Site, StateMode } from "../../../types";
import { createDefaultControls, createSiteInfo, ratingUtils, setStatePlayPauseButton } from "../utils";

function getElapsedTime() {
  let elapsedTime = document.querySelector<HTMLElement>('[class^="styles_time"]');
  if (!elapsedTime)
  {
      let elapsedBar = document.querySelector<HTMLElement>('[class^="styles_bar"]');
      if (!elapsedBar) return 0;
      return Math.round(parseFloat((<HTMLElement>elapsedBar.children[0]).style.getPropertyValue('--width').replace("%", "")));
  }
  const cTime = (<HTMLElement>elapsedTime.children[0])?.innerText;
  const [cMin, cSec] = cTime.split(':').map(Number);
  return (cMin*60+cSec);
}

function getDurationTime() {
  let durationTime = document.querySelector<HTMLElement>('[class^="styles_time"]');
  if (!durationTime) return 100;
  const cTime = (<HTMLElement>durationTime.children[0])?.innerText;
  const fTime = (<HTMLElement>durationTime.children[1])?.innerText;
  const [cMin, cSec] = cTime.split(':').map(Number);
  const [fMin, fSec] = fTime.split(':').map(Number);
  return ((cMin*60+cSec)-(fMin*60-fSec));
}

const Zvuk: Site = {
  debug: {
    getElapsedTime,
  },
  init: null,
  ready: () => !!navigator.mediaSession.metadata,
  info: createSiteInfo({
    name: () => "Zvuk",
    title: () => document.querySelector<HTMLElement>('[class^="styles_infoTitleWrapper"]')?.innerText ?? "",
    artist: () => document.querySelector<HTMLElement>('[class^="styles_artistsWrapper"]')?.innerText ?? "",
    album: () => "",
    cover: () => getMediaSessionCover(),
    state: () => {
      const el = document.querySelector('[class^="styles_controls"]')?.children[1].children[0].children[0];
      if (!el) return StateMode.STOPPED;
      return (el.innerHTML.length>250) ? StateMode.PLAYING : StateMode.PAUSED;
    },
    position: () => getElapsedTime(),
    duration: () => getDurationTime(),
    rating: () => 0,
    volume: () => {
      const el = document.querySelectorAll('[class^="styles_controls"]')[1].children[0].children[0].children[0].children[1].getAttribute('aria-valuenow');
      if (!el) return 100;
      return parseFloat(el);
    },
    shuffle: () => {
      const el = document.querySelectorAll('[class^="styles_controls"]')[1].children[0].children[1].children[0];
      return /styles_activeIconVisible/.test(el.children[1].className);
    },
    repeat: () => {
      const el = document.querySelectorAll('[class^="styles_controls"]')[1].children[0].children[2].children[0];
      if (el.children[0].children[0].querySelectorAll('path').length > 1 ) return Repeat.ONE;
      if (/styles_activeIconVisible/.test(el.children[1].className)) return Repeat.ALL;
      return Repeat.NONE;
    },
  }),
  events: {
    setState: (state) => {
      const button = document.querySelector('[class^="styles_controls"]')?.children[1] as HTMLButtonElement;
      if (!button) throw new Event("Failed to find button");
      const currentState = Zvuk.info.state();
      setStatePlayPauseButton(button, currentState, state);
    },
    skipPrevious: () => {
      const button = document.querySelector('[class^="styles_controls"]')?.children[0] as HTMLButtonElement;
      if (!button) throw new EventError();
      button.click();
    },
    skipNext: () => {
      const button = document.querySelector('[class^="styles_controls"]')?.children[2] as HTMLButtonElement;
      if (!button) throw new EventError();
      button.click();
    },
    setPosition: null,
    setVolume: null,
    setRating: null,
    setShuffle: () => {
      const button = document.querySelectorAll('[class^="styles_controls"]')[1].children[0].children[1] as HTMLButtonElement;
      if (!button) throw new EventError();
      button.click();
    },
    setRepeat: () => {
      const button = document.querySelectorAll('[class^="styles_controls"]')[1].children[0].children[2] as HTMLButtonElement;
      if (!button) throw new EventError();
      button.click();
    },
  },
  controls: () => createDefaultControls(Zvuk),
};

export default Zvuk;
