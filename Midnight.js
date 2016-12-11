//Register Discord events
require("./app/Events.js");

//Start timed events
require("./app/Cron.js");

//Start Discord Bot
require("./app/DiscordUtils.js").start();