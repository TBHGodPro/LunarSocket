import { connectedPlayers } from '..';
import Player from '../player/Player';

export default function findPlayer(
  uuidOrUsername: string,
  cracked?: boolean
): Player {
  if (typeof cracked !== 'undefined')
    return connectedPlayers.find(
      (p) =>
        // skipcq
        p.cracked == Boolean(cracked) &&
        (p.uuid.replace(/-/g, '') === uuidOrUsername.replace(/-/g, '') ||
          p.username === uuidOrUsername)
    );
  else
    return connectedPlayers.find(
      (p) =>
        p.uuid.replace(/-/g, '') === uuidOrUsername.replace(/-/g, '') ||
        p.username === uuidOrUsername
    );
}
