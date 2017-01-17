// @flow

//Register Discord events
import './server_src/Events';

//Start timed events
import './server_src/Cron';

//Start Discord Bot
import DiscordUtils from './server_src/DiscordUtils';
DiscordUtils.start();

//Start express
import './server_src/HTTPServer';
