import Show from './Show.jsx';
import { panesMap as backendPanesMap } from './views/backend';
import { panesMap as classicPanesMap } from './views/classic';

export function createPanesMap() {
  return {
    ...backendPanesMap,
    ...classicPanesMap
  };
}

export default function challengesRoutes() {
  return [{
    path: 'challenges(/:dashedName)',
    component: Show,
    onEnter(nextState, replace) {
      // redirect /challenges to /map
      if (nextState.location.pathname === '/challenges') {
        replace('/map');
      }
    }
  }, {
    path: 'challenges/:block/:dashedName',
    component: Show
  }];
}
