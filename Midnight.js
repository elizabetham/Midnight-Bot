// @flow

import Config from "./config";

//Register Discord events
import './server_src/Events';

//Start timed events
import './server_src/utils/Cron';

//Start Discord Bot
import DiscordUtils from './server_src/utils/DiscordUtils';
DiscordUtils.start();

//Start express
import expressApp from './server_src/http/HTTPServer';

//Start HTTP server
expressApp.listen(Config.HTTP_PORT, () => {
    console.log("Express listening on port " + Config.HTTP_PORT);
});

//Start music Module
import MusicManager from './server_src/music/MusicManager';

//Report unhandled promise rejections
process.on("unhandledRejection", function(err) {
    console.log("UNHANDLED REJECTION:", err);
});
