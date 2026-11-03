import App from './App';
import DirectStory from './ui/DirectStory';
import { directStoryRoute } from './lib/direct-story';
/** Direct links reuse Reader without mounting the family's stateful app. */
export default function Entry({ pathname = window.location.pathname }: { pathname?: string }) {
  if (pathname.startsWith('/read/')) return <DirectStory route={directStoryRoute(pathname)} />;
  return <App />;
}
