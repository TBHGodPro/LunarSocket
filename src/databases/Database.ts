import { CustomCosmetic } from '../api/routes/customCosmetics';
import Player, { DatabasePlayer } from '../player/Player';

export default class Database {
  public async setPlayer(player: Player): Promise<void> {
    console.warn('Database#setPlayer is not implemented');
  }

  public async setPlayerRaw(
    uuid: string,
    player: DatabasePlayer
  ): Promise<void> {
    console.warn('Database#setPlayerRaw is not implemented');
  }

  public async getPlayer(uuid: string): Promise<DatabasePlayer> {
    console.warn('Database#getPlayer is not implemented');
    return null;
  }

  public async getPlayerCount(): Promise<number> {
    console.warn('Database#getPlayerCount is not implemented');
    return null;
  }

  public async getCustomCosmetics(): Promise<CustomCosmetic[]> {
    console.warn('Database#getCustomCosmetics is not implemented');
    return null;
  }
}
