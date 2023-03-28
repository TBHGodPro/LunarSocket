import axios from 'axios';
import { Request, Router } from 'express';
import { DatabaseManager } from '../../databases/Manager';
import findPlayer from '../../utils/findPlayer';
import auth from '../middleware/auth';

const displayColorRouter = Router();

displayColorRouter.patch(
  '/',
  auth,
  async (request: Request<{}, {}, RolesRequestBody>, response) => {
    if (
      typeof request.body.player !== 'string' ||
      typeof request.body.displayColor !== 'number' ||
      typeof request.body.displayPlusColor !== 'number'
    )
      return response.sendStatus(400);

    const player = findPlayer(request.body.player);
    // Not Connected
    if (!player) {
      const addDashes = (i) =>
        `${i.substr(0, 8)}-${i.substr(8, 4)}-${i.substr(12, 4)}-${i.substr(
          16,
          4
        )}-${i.substr(20)}`;
      let uuid = (
        await axios
          .get(
            `https://api.mojang.com/users/profiles/minecraft/${request.body.player}`
          )
          .catch(() => null)
      )?.data?.id;
      if (!uuid) return response.sendStatus(404);
      uuid = addDashes(uuid);
      const player = await DatabaseManager.instance.database.getPlayer(uuid);
      if (!player) return response.sendStatus(404);
      if (
        player.customization.displayColor == request.body.displayColor &&
        player.customization.displayPlusColor == request.body.displayPlusColor
      )
        return response.sendStatus(304);
      player.customization = {
        displayColor: request.body.displayColor,
        displayPlusColor: request.body.displayPlusColor,
      };
      await DatabaseManager.instance.database.setPlayerRaw(uuid, player);
      return response.sendStatus(200);
    }

    const permissions = player.role.data.permissions;
    if (
      !(
        permissions.includes('*') ||
        (permissions.includes('customization.displayColor') &&
          permissions.includes('customization.displayPlusColor'))
      )
    )
      return response
        .status(401)
        .send("Player doesn't have the right to use custom colors");

    player.customization.displayColor = request.body.displayColor;
    player.customization.displayPlusColor = request.body.displayPlusColor;
    await player.updateDatabase();

    player.sendNotification(
      'Customization',
      'Custom Colors Updated! Reconnecting...'
    );
    player.removePlayer();

    response.sendStatus(200);
  }
);

export default displayColorRouter;

interface RolesRequestBody {
  player: string;
  displayColor: number;
  displayPlusColor: number;
}
