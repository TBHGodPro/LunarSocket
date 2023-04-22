import BufWrapper from '@minecraft-js/bufwrapper';
import { EventEmitter } from 'node:events';
import TypedEventEmitter from 'typed-emitter';
import { isProduction } from '..';
import Player from '../player/Player';
import logger from '../utils/logger';
import ApplyCosmeticsPacket from './ApplyCosmeticsPacket';
import ChatMessagePacket from './ChatMessagePacket';
import ClientBanPacket from './ClientBanPacket';
import ConsoleMessagePacket from './ConsoleMessagePacket';
import DoEmotePacket from './DoEmotePacket';
import EquipEmotesPacket from './EquipEmotesPacket';
import ForceCrashPacket from './ForceCrashPacket';
import FriendListPacket from './FriendListPacket';
import FriendMessagePacket from './FriendMessagePacket';
import FriendRequestPacket from './FriendRequestPacket';
import FriendResponsePacket from './FriendResponsePacket';
import FriendUpdatePacket from './FriendUpdatePacket';
import GiveEmotesPacket from './GiveEmotesPacket';
import HostListPacket from './HostListPacket';
import HostListRequestPacket from './HostListRequest';
import JoinServerPacket from './JoinServerPacket';
import KeepAlivePacket from './KeepAlivePacket';
import NotificationPacket from './NotificationPacket';
import PacketId71 from './PacketId71';
import PendingRequestsPacket from './PendingRequestsPacket';
import PlayEmotePacket from './PlayEmotePacket';
import PlayerInfoPacket from './PlayerInfoPacket';
import PlayerInfoRequestPacket from './PlayerInfoRequestPacket';
import ReceiveFriendRequestPacket from './ReceiveFriendRequest';
import RemoveFriendPacket from './RemoveFriendPacket';
import TaskListPacket from './TaskListPacket';
import TaskListRequestPacket from './TaskListRequestPacket';
import ToggleFriendRequestsPacket from './ToggleFriendRequestsPacket';
import UpdatePlusColors from './UpdatePlusColors';
import UpdateVisiblePlayersPacket from './UpdateVisiblePlayersPacket';

export const OutgoingPackets = {
  giveEmotes: GiveEmotesPacket,
  playEmote: PlayEmotePacket,
  notification: NotificationPacket,
  playerInfo: PlayerInfoPacket,
  friendList: FriendListPacket,
  friendMessage: FriendMessagePacket,
  pendingRequestsPacket: PendingRequestsPacket,
  friendRequest: FriendRequestPacket,
  friendResponse: FriendResponsePacket,
  forceCrash: ForceCrashPacket,
  taskListRequest: TaskListRequestPacket,
  hostListRequest: HostListRequestPacket,
  clientBan: ClientBanPacket,
  friendUpdate: FriendUpdatePacket,
  joinServer: JoinServerPacket,
  receiveFriendRequest: ReceiveFriendRequestPacket,
  chatMessage: ChatMessagePacket,
  updatePlusColors: UpdatePlusColors,
};

export enum OutgoingPacketIDs {
  ConsoleMessage = 2,
  Notification = 3,
  FriendList = 4,
  FriendMessage = 5,
  JoinServer = 6,
  PendingRequests = 7,
  PlayerInfo = 8,
  FriendRequest = 9,
  ReceiveFriendRequest = 16,
  RemoveFriend = 17,
  FriendUpdate = 18,
  FriendResponse = 21,
  ForceCrash = 33,
  TaskListRequest = 35,
  PlayEmote = 51,
  GiveEmotes = 57,
  ChatMessage = 65,
  HostListRequest = 67,
  UpdatePlusColors = 73,
  ClientBan = 1056,
}

// Outgoing is when a packet is sent by the server to the client
export class OutgoingPacketHandler extends (EventEmitter as new () => TypedEventEmitter<OutgoingPacketHandlerEvents>) {
  public static packets = Object.values(OutgoingPackets);

  private readonly player: Player;

  public constructor(player: Player) {
    // skipcq
    super();
    this.player = player;
  }

  // skipcq
  public handle(data: Buffer): void {
    const buf = new BufWrapper(data);

    const id = buf.readVarInt();
    const Packet = OutgoingPacketHandler.packets.find((p) => p.id === id);

    if (!Packet) {
      if (!isProduction)
        logger.warn('Unknown packet id (outgoing):', id, data.toString('hex'));
      return this.player.writeToClient(data);
    } else if (!isProduction)
      logger.debug(`Received packet id ${id} (${Packet.name}) from server`);

    const packet = new Packet(buf);
    packet.read();

    const event = Object.keys(OutgoingPackets).find(
      (key) => OutgoingPackets[key] === Packet
    );
    // @ts-expect-error - event is type of string and not keyof OutgoingPacketHandlerEvents but it works anyway
    if (this.listenerCount(event) > 0) this.emit(event, packet);
    else this.player.writeToClient(data);
  }
}

type OutgoingPacketHandlerEvents = {
  [key in keyof typeof OutgoingPackets]: (
    packet: InstanceType<typeof OutgoingPackets[key]>
  ) => void;
};

export const IncomingPackets = {
  doEmote: DoEmotePacket,
  consoleMessage: ConsoleMessagePacket,
  joinServer: JoinServerPacket,
  equipEmotes: EquipEmotesPacket,
  applyCosmetics: ApplyCosmeticsPacket,
  playerInfoRequest: PlayerInfoRequestPacket,
  friendMessage: FriendMessagePacket,
  friendRequest: FriendRequestPacket,
  friendResponse: FriendResponsePacket,
  keepAlive: KeepAlivePacket,
  taskList: TaskListPacket,
  hostList: HostListPacket,
  removeFriend: RemoveFriendPacket,
  toggleFriendRequests: ToggleFriendRequestsPacket,
  updateVisiblePlayers: UpdateVisiblePlayersPacket,
  id71: PacketId71,
};

export enum IncomingPacketIDs {
  ConsoleMessage = 2,
  FriendMessage = 5,
  JoinServer = 6,
  FriendRequest = 9,
  RemoveFriend = 17,
  ApplyCosmetics = 20,
  FriendResponse = 21,
  ToggleFriendRequests = 22,
  ConstantChanged = 24,
  TaskList = 36,
  DoEmote = 39,
  PlayerInfoRequest = 48,
  UpdateVisiblePlayers = 50,
  EquipEmotes = 56,
  KeepAlive = 64,
  HostList = 68,
}

// Incoming is when a packet is sent by the client to the server
export class IncomingPacketHandler extends (EventEmitter as new () => TypedEventEmitter<IncomingPacketHandlerEvents>) {
  public static packets = Object.values(IncomingPackets);

  private readonly player: Player;

  public constructor(player: Player) {
    // skipcq
    super();
    this.player = player;
  }

  // skipcq
  public handle(data: Buffer): void {
    const buf = new BufWrapper(data);

    const id = buf.readVarInt();
    const Packet = IncomingPacketHandler.packets.find((p) => p.id === id);

    if (!Packet) {
      if (!isProduction) logger.warn('Unknown packet id (incoming):', id, data);
      return this.player.writeToServer(data);
    } else if (!isProduction)
      logger.debug(`Received packet id ${id} (${Packet.name}) from the client`);

    const packet = new Packet(buf);
    packet.read();

    const event = Object.keys(IncomingPackets).find(
      (key) => IncomingPackets[key] === Packet
    );

    // @ts-expect-error - event is type of string and not keyof IncomingPacketHandlerEvents but it works anyway
    if (!this.player.cracked && this.listenerCount(event) > 0)
      // @ts-expect-error - same thing
      this.emit(event, packet);
    else this.player.writeToServer(data);
  }
}

type IncomingPacketHandlerEvents = {
  [key in keyof typeof IncomingPackets]: (
    packet: InstanceType<typeof IncomingPackets[key]>
  ) => void;
};
