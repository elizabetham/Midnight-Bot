// @flow

import Config from "./config";

//Register Discord events
import './server_src/Events';

//Start timed events
import './server_src/Cron';

//Start Discord Bot
import DiscordUtils from './server_src/DiscordUtils';
DiscordUtils.start();

//Start express
import expressApp from './server_src/HTTPServer';

//Start HTTP server
expressApp.listen(Config.HTTP_PORT, () => {
    console.log("Express listening on port " + Config.HTTP_PORT);
});