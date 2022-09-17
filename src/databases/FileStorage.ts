import { readFile, stat, writeFile } from 'node:fs/promises';
import { CustomCosmetic } from '../api/routes/customCosmetics';
import Player, { DatabasePlayer } from '../player/Player';
import getConfig from '../utils/config';
import logger from '../utils/logger';
import Database from './Database';

export default class FileStorage extends Database {
  private filePath: string;
  private file: { [key: string]: DatabasePlayer | CustomCosmetic[] };

  public constructor() {
    super();

    this.init().catch((reason) => {
      logger.error('An error occured while initializing FileStorage\n', reason);
      logger.error("Can't proceed without a working database, exiting...");
      process.exit(1);
    });
  }

  private async init(): Promise<void> {
    this.filePath = (await getConfig()).database.config.filePath;
    this.file = {
      customCosmetics: [],
    };

    if (!(await stat(this.filePath).catch(() => undefined))) {
      await this.writeFile();
    }

    const file = await readFile(this.filePath, 'utf8');
    this.file = JSON.parse(file);
  }

  private async writeFile(): Promise<void> {
    await writeFile(this.filePath, JSON.stringify(this.file));
  }

  public async setPlayer(player: Player): Promise<void> {
    this.setPlayerRaw(player.uuid, player.getDatabasePlayer());
  }

  public async setPlayerRaw(
    uuid: string,
    player: DatabasePlayer
  ): Promise<void> {
    this.file[uuid] = player;
    await this.writeFile();
  }

  public async getPlayer(uuid: string): Promise<DatabasePlayer> {
    return this.file[uuid] as DatabasePlayer;
  }

  public async getPlayerCount(): Promise<number> {
    return Object.keys(this.file).length;
  }

  public async getCustomCosmetics(): Promise<CustomCosmetic[]> {
    return this.file.customCosmetics as CustomCosmetic[];
  }
}
