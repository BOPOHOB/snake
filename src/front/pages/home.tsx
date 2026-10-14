import { GameCanvas } from '../components/game';
import { useState } from 'react';
import { Frontend } from '../components/game/frontend';

export const Home = () => {
  const [frontend, setFrontend] = useState(() => new Frontend());
  return <GameCanvas frontend={frontend} />;
};
