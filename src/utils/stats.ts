import { connectedPlayers } from '..';

export const stats = {
  onlinePlayers: {} as { [key: string]: number },
};

function onlineListener(): void {
  setInterval(() => {
    const date = new Date();
    const key = `${date.getHours()}:${date.getMinutes()}`;
    stats.onlinePlayers[key] = connectedPlayers.length;

    setTimeout(() => {
      delete stats.onlinePlayers[key];
    }, 24 * 60 * 60 * 1000);
  }, 1 * 60 * 1000); // Every minutes
}

export async function getLunarLatency() {
  return await connectedPlayers[0]?.getLatency(true);
}

export default function startStats(): void {
  onlineListener();
}
