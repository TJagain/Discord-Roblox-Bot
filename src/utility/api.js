import fetch from "node-fetch";

const BOT_TOKEN = process.env.botToken;
const DISCORD_API_URL = "https://discord.com/api/v10";
const UNKNOWN_MEMBER_ERROR_CODE = 10007;

async function discordGet(path) {
  const response = await fetch(`${DISCORD_API_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
    },
  });
  const body = await response.json().catch(() => null);

  return { response, body };
}

async function getGuildMember(guildId, userId) {
  const { response, body } = await discordGet(
    `/guilds/${guildId}/members/${userId}`,
  );

  // An explicit "Unknown Member" response confirms that this user has left
  // the guild. Other failures (including rate limits and authentication
  // errors) are transient or operational and must not revoke rewards.
  if (response.status === 404 && body?.code === UNKNOWN_MEMBER_ERROR_CODE) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Discord member lookup failed (${response.status} ${response.statusText})`,
    );
  }

  if (
    !body ||
    body.user?.id !== userId ||
    !Object.prototype.hasOwnProperty.call(body, "premium_since")
  ) {
    throw new Error("Discord returned an unexpected guild member response");
  }

  return body;
}

async function getGuild(guildId) {
  const { response, body } = await discordGet(`/guilds/${guildId}`);

  if (!response.ok || !body) {
    throw new Error(
      `Discord guild lookup failed (${response.status} ${response.statusText})`,
    );
  }

  return body;
}

export { getGuildMember, getGuild };
