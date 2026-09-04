import express from "express";
import discord from "discord.js";
import { getGuild, getGuildMember } from "./src/utility/api.js";
import "./slash-commands.js";
const { default: fetch } = await import("node-fetch");

const SERVER_ID = "528302896593371176";
const SERVER_BOOSTER_ID = "675158522933018659"; //"675158522933018659";
const BOT_TOKEN = process.env.botToken;
const REPO_TOKEN = process.env.githubToken;
const REPO_OWNER = "TJagain";
const REPO_NAME = "discord-to-roblox";
const REPO_PATH = "shared-data.json";
const REPO_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${REPO_PATH}`;
const THIRTY_MINUTES = 30 * 60 * 1000; //30 * 60 * 1000;
const BOOSTER_CHANNEL_ID = "675944341520515072";

let updateRepo = false;

const { Client, GatewayIntentBits } = discord;
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});
client.login(BOT_TOKEN);
const channels = client.channels;
let boosterChannel;
client.on("ready", () => {
  channels
    .fetch(BOOSTER_CHANNEL_ID)
    .then((channel) => (boosterChannel = channel))
    .catch(console.error);
});
const app = express();

client.on("messageCreate", async (message) => {
  console.log(message.content);
  if (message.content === "ping") {
    message.channel.send("pong");
  }
});

async function getRepo() {
  try {
    const response = await fetch(REPO_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${REPO_TOKEN}`,
      },
    });

    if (response.status === 200) {
      const fileInfo = await response.json();
      const fileContent = JSON.parse(
        Buffer.from(fileInfo.content, "base64").toString(),
      );
      return [fileContent, fileInfo.sha];
    } else {
      console.error(
        "failed to fetch repo data:",
        response.status,
        response.statusText,
      );
      return [{}, null];
    }
  } catch (error) {
    console.error("other error:", error);
  }
}

async function addBooster(username, userID) {
  //Check if they are already registered
  if (username in boosterCache) {
    return "You are already registered as a booster";
  } else {
    boosterCache[username] = userID;
    updateRepo = true;
    return "Success! You have been added to the queue, I'll let you know when the rewards are updated";
  }
}
let TESTING = false;
async function updateBoosters() {
  console.log("Checking boosters");
  await Promise.all(
    Object.keys(boosterCache).map(async function (username) {
      const userID = boosterCache[username];

      try {
        const member = await getGuildMember(SERVER_ID, userID);
        const isConfirmedNotBoosting =
          member === null || member.premium_since === null;

        if (isConfirmedNotBoosting && !TESTING) {
          delete boosterCache[username];
          updateRepo = true;
          boosterChannel?.send(
            username + " is no longer boosting the server, removing rewards",
          );
        }
      } catch (error) {
        // Fail closed: temporary Discord/API failures keep the existing reward
        // and are retried during the next scheduled verification.
        console.error(
          `Unable to verify Discord member ${userID}; keeping existing rewards:`,
          error,
        );
      }
    }),
  );
  if (updateRepo) {
    updateRepo = false;
    try {
      const updatedContent = JSON.stringify(boosterCache, null, 2);
      const updateResponse = await fetch(REPO_URL, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${REPO_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `New message`,
          content: Buffer.from(updatedContent).toString("base64"),
          sha: boosterSha,
        }),
      });
      if (updateResponse.status === 200 || updateResponse.status === 201) {
        console.log(`successfully updated`);
        boosterChannel?.send(
          "Booster rewards have been successfully updated, game servers should be updated within 30 minutes",
        );
      } else {
        updateRepo = true;
        console.log("failed to update");
        console.log(updateResponse.status + ": " + updateResponse.statusText);
        boosterChannel?.send(
          "Booster rewards have failed to update, I will try again soon",
        );
        console.log(boosterCache);
        let [repoBoosters, sha] = await getRepo();
        console.log(repoBoosters);
      }
    } catch (error) {
      console.error("other error:", error);
    }
  }
}

async function updateRepo2(username, userID) {
  try {
    const { default: fetch } = await import("node-fetch");
    const response = await fetch(REPO_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${REPO_TOKEN}`,
      },
    });

    if (response.status === 200) {
      const fileInfo = await response.json();
      const fileContent = JSON.parse(
        Buffer.from(fileInfo.content, "base64").toString(),
      );
      //Check if they are already registered
      if (username in fileContent) {
        return "You are already registered as a booster";
      }
      //If not then add them to the file and update the repositry
      fileContent[username] = userID;
      const updatedContent = JSON.stringify(fileContent, null, 2);
      const updateResponse = await fetch(REPO_URL, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${REPO_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `New message`,
          content: Buffer.from(updatedContent).toString("base64"),
          sha: fileInfo.sha,
        }),
      });

      if (updateResponse.status === 200) {
        console.log(`successfully updated user: "${username}"`);
        return "You have been registered as a server booster!";
      } else {
        console.error("failed to update");
        return "An error has occured: failed to update";
      }
    } else {
      console.error("failed to fetch");
      return "An error has occured: failed to fetch";
    }
  } catch (error) {
    console.error("other error:", error);
    return "An error has occured";
  }
}

async function updateBoosters2() {
  try {
    const { default: fetch } = await import("node-fetch");
    const response = await fetch(REPO_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${REPO_TOKEN}`,
      },
    });

    if (response.status === 200) {
      const fileInfo = await response.json();
      const fileContent = JSON.parse(
        Buffer.from(fileInfo.content, "base64").toString(),
      );
      let fileChanged = false;
      await Promise.all(
        Object.keys(fileContent).map(async function (username) {
          let userID = fileContent[username];
          let member = await getGuildMember(SERVER_ID, userID);
          if (!member.premium_since) {
            delete fileContent[username];
            if (!fileChanged) {
              fileChanged = true;
            }

            boosterChannel.send(
              username + " is no longer boosting the server, removed rewards",
            );
            //console.log(username + " is no longer a booster")
          }
          //let guild = await getGuild(SERVER_ID)
        }),
      );
      if (!fileChanged) {
        return;
      }
      const updatedContent = JSON.stringify(fileContent, null, 2);
      const updateResponse = await fetch(REPO_URL, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${REPO_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `New message`,
          content: Buffer.from(updatedContent).toString("base64"),
          sha: fileInfo.sha,
        }),
      });

      if (updateResponse.status === 200) {
        console.log(`successfully updated`);
      } else {
        console.error("failed to update");
      }
    } else {
      console.error("failed to fetch");
    }
  } catch (error) {
    console.error("other error:", error);
  }
}

let [boosterCache, boosterSha] = await getRepo();
//console.log(boosterCache)
//console.log(boosterSha)
client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    let response;
    switch (interaction.commandName) {
      case "ping":
        response = { content: "pong" };
        interaction.reply(response);
        break;
      case "server":
        response = { content: "TODO" };
        interaction.reply(response);
        break;
      case "user":
        response = { content: "TODO" };
        interaction.reply(response);
        break;
      case "register-as-booster":
        let member = interaction.member;
        let roles = member.roles.cache;
        if (roles.has(SERVER_BOOSTER_ID)) {
          let result = await addBooster(member.nickname, member.id);
          response = { content: result };
        } else {
          response = { content: "You are not a server booster" };
        }
        interaction.reply(response);
        break;
      case "test":
        console.log("test1");
        let nickname = "FrogNinjaX";
        let id = "222476147907231744";
        let result = await addBooster(nickname, id);
        response = { content: result };
        console.log(response);
        interaction.reply(response);
        break;
      case "test2":
        console.log("test2");
        let nickname2 = "FrogNinjaX2";
        let id2 = "222476147907231745";
        let result2 = await addBooster(nickname2, id2);
        response = { content: result2 };
        console.log(response);
        interaction.reply(response);
        break;
      //let myRole = message.guild.roles.cache.get("264410914592129025");
      //console.log(roles.cache)
      /*if (roles.includes(SERVER_BOOSTER_ID)) {
          updateRepo(member.nickname)
          response = { content: "You have been registered as a server booster!" }
        } else {
          response = { content: "You are not a server booster" }
        }
        interaction.reply(response)*/
    }
  }
});

app.listen(3000, () => {
  console.log("Project is running!");
});

app.get("/", (req, res) => {
  res.send("Hello world!");
});

setInterval(updateBoosters, THIRTY_MINUTES);
console.log("end reached");

//let member1 = await getGuildMember(SERVER_ID, "570588901652037635");
//console.log(member1);

//let member2 = await getGuildMember(SERVER_ID, "222476147907231744");
//console.log(member2);

/*
function isBooster(role) {
  return role.id === SERVER_BOOSTER_ID;
}

let guild = await getGuild(SERVER_ID)
let role = guild.roles.find(isBooster)
*/
