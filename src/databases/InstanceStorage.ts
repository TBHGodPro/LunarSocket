import { CustomCosmetic } from '../api/routes/customCosmetics';
import Player, { DatabasePlayer } from '../player/Player';
import Database from './Database';

export default class InstanceStorage extends Database {
  private database: Map<string, DatabasePlayer>;
  private customCosmetics: CustomCosmetic[];

  public constructor() {
    super();
    this.database = new Map<string, DatabasePlayer>();
    this.customCosmetics = [];
  }

  public async setPlayer(player: Player): Promise<void> {
    this.setPlayerRaw(player.uuid, player.getDatabasePlayer());
  }

  public async setPlayerRaw(
    uuid: string,
    player: DatabasePlayer
  ): Promise<void> {
    this.database.set(uuid, player);
  }

  public async getPlayer(uuid: string): Promise<DatabasePlayer> {
    return this.database.get(uuid);
  }

  public async getPlayerCount(): Promise<number> {
    return Object.keys(this.database).length;
  }

  public async getCustomCosmetics(): Promise<CustomCosmetic[]> {
    return this.customCosmetics;
  }
}
