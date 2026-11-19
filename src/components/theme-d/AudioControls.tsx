import { useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';
import { isMusicEnabled, toggleMusic } from '@/lib/music';
import { isSoundEnabled, playSound, toggleSound } from '@/lib/sound';

import styles from '@/components/theme-d/AudioControls.module.css';

/**
 * Theme D audio controls (Gói H8): two compact round buttons — music
 * (🎵) and sound effects (🔊). The choice is persisted by the audio
 * libs themselves (localStorage), so a muted game stays muted on the
 * next visit. Used in the player shell top bar and, in compact form,
 * inside the stall sign / market board so the control is reachable
 * even on the full-screen sell-loop pages.
 */
export function AudioControls({ compact = false }: { compact?: boolean }) {
  const { dict } = useTranslation();
  const [musicOn, setMusicOn] = useState<boolean>(() => isMusicEnabled());
  const [sfxOn, setSfxOn] = useState<boolean>(() => isSoundEnabled());

  const handleMusic = () => {
    const next = toggleMusic();
    setMusicOn(next);
    if (next) playSound('click');
  };

  const handleSfx = () => {
    const next = toggleSound();
    setSfxOn(next);
    if (next) playSound('click');
  };

  return (
    <div className={`${styles.row} ${compact ? styles.compact : ''}`} role="group" aria-label={dict.sound.title}>
      <button
        type="button"
        className={`${styles.btn} ${musicOn ? '' : styles.off}`}
        onClick={handleMusic}
        aria-label={dict.sound.musicToggle}
        aria-pressed={musicOn}
        title={musicOn ? dict.sound.musicOn : dict.sound.musicOff}
        data-audio-toggle="music"
        data-state={musicOn ? 'on' : 'off'}
      >
        <span aria-hidden>{musicOn ? '🎵' : '🚫'}</span>
      </button>
      <button
        type="button"
        className={`${styles.btn} ${sfxOn ? '' : styles.off}`}
        onClick={handleSfx}
        aria-label={dict.sound.toggle}
        aria-pressed={sfxOn}
        title={sfxOn ? dict.sound.enabled : dict.sound.disabled}
        data-audio-toggle="sfx"
        data-state={sfxOn ? 'on' : 'off'}
      >
        <span aria-hidden>{sfxOn ? '🔊' : '🔇'}</span>
      </button>
    </div>
  );
}
