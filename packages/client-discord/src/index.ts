import { parseBooleanFromText } from "@elizaos/core";
import { DiscordClientInterface } from "./client";

const discordPlugin = {
  name: "discord",
  description: "Discord client plugin",
  clients: [
    ...Array.from(
      {
        length: parseBooleanFromText(process.env.DISCORD_MULTI_CLIENT)
          ? parseInt(process.env.DISCORD_MULTI_CLIENT_COUNT)
          : 1,
      },
      (_, i) => DiscordClientInterface
    ),
  ],
};
export default discordPlugin;
