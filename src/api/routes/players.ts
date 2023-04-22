import axios from 'axios';
import { Router } from 'express';
import { connectedPlayers } from '../..';
import { DatabaseManager } from '../../databases/Manager';
import ForceCrashPacket from '../../packets/ForceCrashPacket';
import Player, { DatabasePlayer } from '../../player/Player';
import { getConfig } from '../../utils/config';
import { registerEvent } from '../../utils/events';
import findPlayer from '../../utils/findPlayer';
import auth from '../middleware/auth';
import { parseUUID } from '@minecraft-js/uuid';

const playersRouter = Router();

playersRouter.get('/', auth, (request, response) => {
  const players = connectedPlayers.map((p) => ({
    uuid: p.uuid,
    username: p.username,
    role: p.role.name,
    server: p.server,
    version: p.version,
    cracked: p.cracked,
  }));

  response.status(200).send(players);
});

playersRouter.post('/kick', auth, (req, res) => {
  const uuid = req.body.uuid;
  if (typeof uuid !== 'string') return res.sendStatus(400);
  const player = findPlayer(uuid);
  if (!player) return res.sendStatus(404);
  player.removePlayer();
  return res.sendStatus(200);
});

playersRouter.post('/crash', auth, (req, res) => {
  const uuid = req.body.uuid;
  if (typeof uuid !== 'string') return res.sendStatus(400);
  const player = findPlayer(uuid);
  if (!player) return res.sendStatus(404);
  const packet = new ForceCrashPacket();
  packet.write({});
  player.writeToClient(packet);
  if (!req.body.silent) registerEvent('player-crash', player.username);
  return res.sendStatus(200);
});

playersRouter.get('/:uuid', auth, async (req, res) => {
  // UUID can be either a UUID or Username
  const uuid = req.params.uuid;
  if (typeof uuid !== 'string') return res.sendStatus(400);
  let player: Player | DatabasePlayer = findPlayer(uuid);
  if (player)
    return res.status(200).send({
      online: true,
      uuid: player.uuid,
      username: player.username,
      role: player.role.name,
      roleData: player.role.data,
      server: player.server,
      version: player.version,
      cracked: player.cracked,
      colors: {
        icon: player.color,
        plus: player.plusColor,
      },
    });
  else {
    // Storage of actual values
    let realUUID;
    let username;

    // Get Player (Imagine "uuid" is a valid UUID)
    player = await DatabaseManager.instance.database.getPlayer(uuid);
    if (player) {
      // Success
      realUUID = parseUUID(uuid).toString(true);
      // Fetch Username, if fail return 404
      username = await axios
        .get(
          `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`
        )
        .then((res) => res.data?.name)
        .catch(() => null);
      if (!username) return res.sendStatus(404);
    } else {
      // Fail, "uuid" is probably a Username
      username = uuid;
      // Fetch UUID, if fail return 404
      realUUID = await axios
        .get(
          `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`
        )
        .then((res) => parseUUID(res.data?.id).toString(true))
        .catch(() => null);
      if (!realUUID) return res.sendStatus(404);

      // Fetch player based on new UUID
      player = await DatabaseManager.instance.database.getPlayer(realUUID);
    }

    // If still no player, return 404
    if (!player) return res.sendStatus(404);

    const config = await getConfig();
    const roleData = config.roles[player.role] || config.roles['default'];

    return res.status(200).send({
      online: false,
      uuid: realUUID,
      username,
      role: config.roles[player.role] ? player.role : 'default',
      roleData,
      colors: {
        icon: player.customization.displayColor ?? roleData.iconColor,
        plus: player.customization.displayPlusColor ?? roleData.plusColor,
      },
    });
  }
});

export default playersRouter;
