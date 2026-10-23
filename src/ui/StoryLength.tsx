import { localeUi, type AppLocale } from '../lib/app-locale';

export type StoryLengthChoice = 'short' | 'full' | 'more';

export default function StoryLength({ locale, len, setLen, minutes, additionalMinutes = 3 }: {
  locale: AppLocale;
  len: StoryLengthChoice;
  setLen: (length: StoryLengthChoice) => void;
  minutes: Record<string, number>;
  additionalMinutes?: number;
}) {
  const ui = localeUi(locale);
  const duration = len === 'short' ? minutes.short : len === 'full' ? minutes.full
    : minutes.full + additionalMinutes;
  return <div className="dial" data-story-length-controls>
    <div className="lbl"><span className="eyebrow">{ui.howLong}</span><span>{duration} {ui.minutes}</span></div>
    <div className="opts" role="group" aria-label={ui.storyLength}>
      <button aria-pressed={len === 'short'} onClick={() => setLen('short')}>{ui.short}<small>{minutes.short} {ui.reader.minutes}</small></button>
      <button aria-pressed={len === 'full'} onClick={() => setLen('full')}>{ui.full}<small>{minutes.full} {ui.reader.minutes}</small></button>
      <button aria-pressed={len === 'more'} onClick={() => setLen('more')}>{ui.oneMore}<small>{ui.linkedStory}</small></button>
    </div>
  </div>;
}
