import getConfig from '../utils/config';
import logger from '../utils/logger';
import FileStorage from './FileStorage';
import InstanceStorage from './InstanceStorage';
import Mongo from './Mongo';

class DatabaseManager {
  public static constructors = {
    instanceStorage: InstanceStorage,
    mongo: Mongo,
    fileStorage: FileStorage,
  } as const;
  public static instance = new DatabaseManager();

  public database: InstanceType<
    typeof DatabaseManager.constructors[keyof typeof DatabaseManager.constructors]
  >;
  private constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    const config = await getConfig();

    logger.log('Using database:', config.database.type);

    this.database = new DatabaseManager.constructors[config.database.type]();
  }
}

export default DatabaseManager.instance;
export { DatabaseManager };
