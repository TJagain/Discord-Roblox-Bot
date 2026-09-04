import express from "express";
import { getGuild } from "../utility/api.js";
const router = express.Router();

//UNUSED AT THE MOMENT, FINISH OR DELETE LATER
router.get("_", async (req, res) => {
  const { guildId } = req.params;
  try {
    const roles = await getGuild();
    res.send();
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: "Internal Server Error" });
  }
});
