import discord from "discord.js"
const {REST, Routes, SlashCommandBuilder} = discord

const botID = "1214759026555097138"
const serverID = "528302896593371176"
const botToken = process.env.botToken
//add cooldown
const commands = [
  new SlashCommandBuilder()
    .setName("register-as-booster")
    .setDescription("[SERVER BOOSTER ONLY] Registers server booster")
    .setDefaultMemberPermissions(0),
  /*
  new SlashCommandBuilder()
    .setName("test")
    .setDescription("Testing bot stuff"),
  new SlashCommandBuilder()
    .setName("test2")
    .setDescription("Testing bot stuff"),
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with pong!"),
  new SlashCommandBuilder()
    .setName("server")
    .setDescription("Replies with server info!"),
  new SlashCommandBuilder()
    .setName("user")
    .setDescription("Replies with user info!")
    .addUserOption(option => {
      option.setName("target")
      option.setDescription("The user to get info about")
      option.setRequired(true)
      return option
    }),
  */
]

const rest = new REST().setToken(botToken)
const slashRegister = async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(botID, serverID), {body: commands})
  } catch (error) {
    console.error(error)
  }
}
slashRegister()