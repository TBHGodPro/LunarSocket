import checkUUID from '../utils/checkUUID';
import { editConfig, getConfig } from '../utils/config';
import Command from './Command';

const command = new Command('whitelist', 'Manage the whitelist');

command.help = `usage: whitelist <action> §o[value]
  actions:
    §lstatus§r    Get whitelist status (enabled/disabled)
    §lon§r        Enable whitelist
    §loff§r       Disable whitelist
    §llist§r      List whitelisted players (uuids)
    §ladd§r       Add a player to the whitelist, the value is the uuid
    §lremove§r    Remove a player from the whitelist, the value is the uuid
`;

command.setHandler(async (player, command, args) => {
  const actions = ['status', 'on', 'off', 'list', 'add', 'remove'];

  if (!actions.includes(args[0]))
    return player.sendConsoleMessage(
      `§cYou must specify an action! Valid actions: ${actions.join(', ')}`
    );

  function invalidValue(): void {
    player.sendConsoleMessage(
      `§cYou must specify a value for action ${args[0]}!`
    );
  }

  const config = await getConfig();

  switch (args[0]) {
    case 'status':
      return player.sendConsoleMessage(
        `Whitelist is currently ${
          config.whitelist.enabled ? '§aenabled' : '§cdisabled'
        }`
      );

    case 'on':
      await editConfig({
        ...config,
        whitelist: { ...config.whitelist, enabled: true },
      });
      return player.sendConsoleMessage('Whitelist has been §aenabled');

    case 'off':
      await editConfig({
        ...config,
        whitelist: { ...config.whitelist, enabled: false },
      });
      return player.sendConsoleMessage('Whitelist has been §cdisabled');

    case 'list':
      return player.sendConsoleMessage(
        `Players whitelisted: §o${config.whitelist.list.join(', ')}`
      );

    case 'add':
      if (!args[1]) return invalidValue();

      if (!checkUUID(args[1]))
        return player.sendConsoleMessage(
          "§cThe UUID you provided isn't valid."
        );

      await editConfig({
        ...config,
        whitelist: {
          ...config.whitelist,
          list: [...config.whitelist.list, args[1]],
        },
      });
      return player.sendConsoleMessage(
        `${args[1]} has been added to the whitelist`
      );

    case 'remove':
      if (!args[1]) return invalidValue();

      if (!checkUUID(args[1]))
        return player.sendConsoleMessage(
          "§cThe UUID you provided isn't valid."
        );

      await editConfig({
        ...config,
        whitelist: {
          ...config.whitelist,
          list: config.whitelist.list.filter((uuid) => uuid !== args[1]),
        },
      });
      return player.sendConsoleMessage(
        `${args[1]} has been removed from the whitelist`
      );
    default:
      // skipcq
      return;
  }
});

export default command;
