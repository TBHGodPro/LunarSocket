import { once } from 'events';
import { join } from 'path';
import { parse as parseURL } from 'url';
import { Server as WebSocketServer } from 'ws';
import createServer, { dashboardWS, emitToDashboard } from './api';
import { DatabaseManager } from './databases/Manager';
import Packet from './packets/Packet';
import Player, { Handshake } from './player/Player';
import ServerString from './utils/ServerString';
import { getConfig, initConfig } from './utils/config';
import { registerEvent } from './utils/events';
import logger from './utils/logger';
import { getCosmeticsIndex } from './utils/lunar';
import startStats from './utils/stats';

console.log(`  _                               _____            _        _   
 | |                             / ____|          | |      | |  
 | |    _   _ _ __   __ _ _ __  | (___   ___   ___| | _____| |_ 
 | |   | | | | '_ \\ / _\` | '__|  \\___ \\ / _ \\ / __| |/ / _ \\ __|
 | |___| |_| | | | | (_| | |     ____) | (_) | (__|   <  __/ |_ 
 |______\\__,_|_| |_|\\__,_|_|    |_____/ \\___/ \\___|_|\\_\\___|\\__|\n`);

let config = initConfig();
export const httpServer = createServer();
export const isProduction = process.env.LUNARSOCKET_DEBUG !== 'true';

const server = new WebSocketServer({
  noServer: true,
});

httpServer.on('upgrade', async (req, socket, head) => {
  const { pathname } = parseURL(req.url);

  if (pathname.startsWith('/api/dashboard/server'))
    dashboardWS.handleUpgrade(req, socket, head, (ws) =>
      dashboardWS.emit('connection', ws, req)
    );
  else if (pathname.startsWith(config.server.websocketPath)) {
    if (pathname.startsWith(join(config.server.websocketPath, '/cracked')))
      req.headers.authorization = `crackedUser:${req.headers.username}`;
    server.handleUpgrade(req, socket, head, (ws) =>
      server.emit('connection', ws, req)
    );
  } else socket.destroy();
});

server.on('error', (error) => logger.error(error));

server.on('listening', () => {
  logger.log(`Server listening on port ${config.server.port}`);
  registerEvent('start', Date.now().toString());
});

server.on('connection', async (socket, request) => {
  if (!DatabaseManager.instance.database.ready)
    await once(DatabaseManager.instance.database.emitter, 'ready');

  const getHeader = (name: string) => request.headers[name.toLowerCase()];

  const handshake = {} as Handshake;

  for (const header of [
    'accountType',
    'arch',
    'Authorization',
    'branch',
    'clothCloak',
    'gitCommit',
    'hatHeightOffset',
    'hwid',
    'launcherVersion',
    'lunarPlusColor',
    'os',
    'playerId',
    'protocolVersion',
    'server',
    'showHatsOverHelmet',
    'showHatsOverSkinLayer',
    'username',
    'version',
    'flipShoulderPet',
    'ichorModules',
    'showOverBoots',
    'showOverChestplate',
    'showOverLeggings',
  ]) {
    handshake[header] = getHeader(header) ?? '';
  }

  handshake.Host = 'assetserver.lunarclientprod.com';

  // Ignoring players with older/newer protocol versions
  if (handshake.protocolVersion !== '9')
    return socket.close(1002, 'Incompatible protocol version, requires 9');

  config = await getConfig();

  if (
    config.whitelist.enabled &&
    !config.whitelist.list.includes(handshake.playerId)
  )
    return socket.close(3000, 'You are not whitelisted');
  if (config.blacklist.list.includes(handshake.playerId))
    return socket.close(3000, 'You have been blacklisted.');

  // Closing the connection if the player is already connected
  if (
    connectedPlayers.find(
      (p) =>
        p.uuid === handshake.playerId ||
        (p.username === handshake.username && !p.cracked)
    )
  )
    return socket.close(3001, 'Already connected');

  // Closing any other connections (probably cracked) with the same username (should be impossible)
  connectedPlayers
    .filter(
      (p) => p.uuid === handshake.playerId || p.username === handshake.username
    )
    .forEach((con) => con.removePlayer(3001, 'Already Connected'));

  const cracked = (getHeader('Authorization') as string)
    .trim()
    .startsWith('crackedUser:');

  const player = new Player(
    socket,
    handshake,
    await getCosmeticsIndex(),
    cracked
  );

  emitToDashboard('playerAdd', {
    uuid: player.uuid,
    username: player.username,
    role: player.role.name,
    server: player.server,
    version: player.version,
    cracked: player.cracked,
  });
  return connectedPlayers.push(player);
});

export function broadcast(
  data: Buffer | Packet,
  broadcastServer?: string,
  broadcastPlayer?: Player
): void {
  const playerServer = new ServerString(broadcastServer);

  connectedPlayers.forEach((p) => {
    if (
      broadcastPlayer &&
      (p.uuid === broadcastPlayer.uuid || p.cracked !== broadcastPlayer.cracked)
    )
      return;
    if (broadcastServer) {
      if (ServerString.match(playerServer, p.server)) p.writeToClient(data);
    } else p.writeToClient(data);
  });
}

export function removePlayer(uuid: string): void {
  connectedPlayers.splice(
    connectedPlayers.findIndex((p) => p.uuid === uuid),
    1
  );
  emitToDashboard('playerRemove', uuid);
}

export const connectedPlayers: Player[] = [];

startStats();

process.on('uncaughtException', (error) => logger.error(error));
