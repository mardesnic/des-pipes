import { useEffect, useState } from 'react';

import { BLOOM_MS, Board, FLOW_MS } from './components/Board';
import { HomeLink } from './components/HomeLink';
import { Icon } from './components/Icon';
import { NewGame, SettingsView } from './components/Menu';
import { Confetti } from './components/Confetti';
import {
  initialStats,
  initialStore,
  isSolved,
  newRound,
  recordWin,
  tapTile,
  water,
  type Level,
  type Round,
  type Stats,
  type Store,
} from './lib/game';
import { STRINGS, detectLang } from './lib/i18n';
import { popMenu, pushMenu, useBackButton } from './lib/use-back-button';
import { useCheer, usePlop } from './lib/use-cheer';
import { useLanguage, useSound } from './lib/use-shared-settings';
import { useStoredState } from './lib/use-stored-state';
import { useWakeLock } from './lib/use-wake-lock';

type View = 'play' | 'new' | 'settings';

export default function App() {
  // Keys are prefixed: other apps on the same GitHub Pages origin share
  // this storage.
  const [store, setStore] = useStoredState<Store>('pipes', initialStore);
  const [stats, setStats] = useStoredState<Stats>('pipes-stats', initialStats);

  const [language, setLanguage] = useLanguage();
  const lang = language === 'auto' ? detectLang() : language;
  const t = STRINGS[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.title;
  }, [lang, t]);

  const [view, setViewState] = useState<View>(store.round ? 'play' : 'new');
  // Menus open over the game, so the phone's Back button closes them.
  const setView = (next: View) => {
    if (next === 'play') popMenu();
    else pushMenu();
    setViewState(next);
  };
  useBackButton(() => {
    if (store.round) setViewState('play');
  });
  useWakeLock();
  const [sound, setSound] = useSound();
  const cheer = useCheer(sound);
  const plop = usePlop(sound);
  const [celebrating, setCelebrating] = useState(false);
  const round = store.round;

  const start = (level: Level) => {
    setStore({
      round: newRound(level, Math.random, round),
    });
    setView('play');
  };

  const solved = round && isSolved(round);
  // When the flower has opened: the water runs to it, then it blooms.
  const bloomed = (r: Round) => water(r).size * FLOW_MS + BLOOM_MS;

  const onTile = (tile: number) => {
    if (!round) return;
    const next = tapTile(round, tile);
    if (next === round) return;
    setStore({ round: next });
    const reached = water(next).size;
    if (isSolved(next)) {
      plop('flow');
      setStats(recordWin(stats, next));
      setTimeout(() => {
        setCelebrating(true);
        cheer();
      }, bloomed(next));
    } else plop(reached > water(round).size ? 'flow' : 'turn');
  };

  return (
    <main className={view === 'play' && round ? 'app app--play' : 'app'}>
      <header className='header'>
        <div className='header__title'>
          <HomeLink label={t.allGames} />
          <h1>{t.title}</h1>
        </div>
        <div className='header__actions'>
          {view === 'play' ? (
            <>
              <button
                className='button button--small'
                onClick={() => setView('new')}
              >
                {t.newGame}
              </button>
              <button
                className='button button--small button--icon'
                onClick={() => setView('settings')}
                aria-label={t.settings}
              >
                <Icon name='settings' />
              </button>
            </>
          ) : (
            round && (
              <button
                className='button button--small button--icon'
                onClick={() => setView('play')}
                aria-label={t.close}
              >
                <Icon name='close' />
              </button>
            )
          )}
        </div>
      </header>

      {view === 'new' && <NewGame onStart={start} t={t} />}
      {view === 'settings' && (
        <SettingsView
          language={language}
          setLanguage={setLanguage}
          sound={sound}
          setSound={setSound}
          stats={stats}
          t={t}
        />
      )}

      {view === 'play' && round && (
        <>
          <div className='stage'>
            <Board round={round} onTile={onTile} t={t} />
          </div>

          {solved && (
            <section
              className='card solved'
              style={{ animationDelay: `${bloomed(round)}ms` }}
            >
              <h2>{t.solved}</h2>
              <div className='solved__actions'>
                <button className='button' onClick={() => start(round.level)}>
                  {t.next}
                </button>
                <button
                  className='button button--secondary'
                  onClick={() => setView('new')}
                >
                  {t.changeLevel}
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {view === 'settings' && (
        <footer className='footer'>
          <a href='/des-kids-games/'>{t.allGames}</a>
          <a href='https://github.com/mardesnic/des-pipes'>{t.source}</a>
          <span className='footer__version'>
            {t.version} {__VERSION__}
          </span>
        </footer>
      )}
      {celebrating && <Confetti onDone={() => setCelebrating(false)} />}
    </main>
  );
}
