import axios from 'axios';
import { broadcast, connectedPlayers } from '..';
import CommandHandler from '../commands/CommandHandler';
import FriendListPacket from '../packets/FriendListPacket';
import GiveEmotesPacket from '../packets/GiveEmotesPacket';
import NotificationPacket from '../packets/NotificationPacket';
import Packet from '../packets/Packet';
import { IncomingPacketIDs } from '../packets/PacketHandlers';
import PendingRequestsPacket from '../packets/PendingRequestsPacket';
import PlayEmotePacket from '../packets/PlayEmotePacket';
import PlayerInfoPacket from '../packets/PlayerInfoPacket';
import Player from '../player/Player';
import { getConfig } from './config';
import { registerEvent } from './events';
import logger from './logger';

const existingUsernames = [];
const nonExistingUsernames = [];

export default async function handleCrackedPlayer(
  player: Player
): Promise<
  void | ((id: number, data: any, packet: Packet) => void | Promise<void>)
> {
  player.disconnected = false;

  // If we haven't cached the username as non-existing
  if (!nonExistingUsernames.includes(player.username)) {
    if (
      // We have the username cached as existing
      existingUsernames.includes(player.username) ||
      // There is another user connected with the same username
      connectedPlayers.filter((i) => i.username === player.username).length > 1
    )
      return player.removePlayer(4001);
    if (
      // Fetch whether the username exists
      (
        await axios
          .get(
            `https://api.mojang.com/users/profiles/minecraft/${player.username}`
          )
          .catch(() => ({ status: 204 }))
      ).status === 204
    ) {
      // It does exist, so add it to the cache
      existingUsernames.push(player.username);
      return player.removePlayer(4001);

      // It doesn't exist, so add it to the cache
    } else nonExistingUsernames.push(player.username);
  }

  const config = await getConfig();

  await player.setRole('default', false);
  player.operator = false;
  player.commandHandler = new CommandHandler(player);

  const giveEmotes = new GiveEmotesPacket();
  giveEmotes.write({
    owned: player.emotes.owned.fake ?? [],
    equipped: player.emotes.equipped.fake ?? [],
  });
  player.writeToClient(giveEmotes);

  function getPlayerInfo(p: Player, petFlipShoulder = false) {
    const playerInfo = new PlayerInfoPacket();
    playerInfo.write({
      uuid: p.handshake.playerId || '',
      cosmetics: p.cosmetics.fake ?? [],
      color: p.role.data.iconColor ?? 16777215,
      premium: p.premium.fake ?? false,
      clothCloak: p.handshake.clothCloak
        ? p.handshake.clothCloak === 'true'
        : p.clothCloak.fake ?? false,
      showHatAboveHelmet: p.handshake.showHatsOverHelmet
        ? p.handshake.showHatsOverHelmet === 'true'
        : true,
      scaleHatWithHeadwear: true,
      adjustableHeightCosmetics: p.handshake.hatHeightOffset
        ? JSON.parse(p.handshake.hatHeightOffset)
        : {},
      plusColor: p.role.data.plusColor ?? 58649,
      unknownBooleanA: false,
      petFlipShoulder,
      unknownBooleanB: true,
      unknownBooleanC: true,
      unknownBooleanD: true,
    });
    return playerInfo;
  }
  player.writeToClient(getPlayerInfo(player, false));

  const pendingRequests = new PendingRequestsPacket();
  pendingRequests.write({
    bulk: [],
  });
  player.writeToClient(pendingRequests);

  function getFriendList() {
    const friendList = new FriendListPacket();
    friendList.write({
      consoleAccess: false,
      requestsEnabled: false,
      online: [],
      offline: [],
    });
    return friendList;
  }
  player.writeToClient(getFriendList());

  logger.log(player.username, 'connected with cracked!');
  registerEvent('login', `cracked:${player.username}`);

  // After all starter packets are sent send a hi notification
  setTimeout(() => {
    const notification = new NotificationPacket();
    notification.write({
      title: '',
      message: config.welcomeMessage || '',
    });
    player.writeToClient(notification);
  }, 2000);

  const LCPlayers = [];

  return function (id: number, data: any, packet: Packet) {
    switch (id) {
      case IncomingPacketIDs.JoinServer: {
        if (player.server !== packet.data.server)
          player.incomingPacketHandler.emit('joinServer', packet);
        break;
      }
      case IncomingPacketIDs.FriendRequest: {
        const notif = new NotificationPacket();
        notif.write({
          title: 'ERROR',
          message: "You can't add friends on a cracked account!",
        });
        player.writeToClient(notif);
        break;
      }
      case IncomingPacketIDs.ApplyCosmetics: {
        for (const cosmetic of packet.data.cosmetics) {
          player.setCosmeticState(cosmetic.id, cosmetic.equipped);
        }
        player.clothCloak.fake = packet.data.clothCloak;

        player.adjustableHeightCosmetics =
          packet.data.adjustableHeightCosmetics;
        const newAdjustableHeightCosmetics: { [key: string]: number } = {};
        for (const cosmetic in packet.data.adjustableHeightCosmetics)
          if (
            Object.prototype.hasOwnProperty.call(
              packet.data.adjustableHeightCosmetics,
              cosmetic
            )
          )
            if (player.cosmetics.owned.find((c) => c.id === parseInt(cosmetic)))
              newAdjustableHeightCosmetics[cosmetic] =
                packet.data.adjustableHeightCosmetics[cosmetic];

        const playerInfo = getPlayerInfo(player, data.petFlipShoulder);
        player.writeToClient(playerInfo);
        broadcast(playerInfo, player.server, player);
        break;
      }
      case IncomingPacketIDs.ToggleFriendRequests: {
        if (data.status) {
          player.writeToClient(getFriendList());
          const notif = new NotificationPacket();
          notif.write({
            title: 'ERROR',
            message: "You can't enable friend requests on a cracked account!",
          });
          player.writeToClient(notif);
        }
        break;
      }
      case IncomingPacketIDs.DoEmote: {
        const packet = new PlayEmotePacket();
        packet.write({
          uuid: player.handshake.playerId,
          id: data.id,
          metadata: 0,
        });
        player.writeToClient(packet);
        broadcast(packet, player.server, player);
        break;
      }
      case IncomingPacketIDs.PlayerInfoRequest: {
        for (const p of data.uuids
          .map((u) =>
            connectedPlayers.find(
              (p) => p.cracked && p.handshake.playerId === u
            )
          )
          .filter(
            (p) => p && !LCPlayers.includes(p.handshake.playerId)
          ) as Player[]) {
          const playerInfo = getPlayerInfo(p);
          player.writeToClient(playerInfo);
          LCPlayers.push(p.handshake.playerId);
        }
        break;
      }
      default:
        break;
    }
  };
}
