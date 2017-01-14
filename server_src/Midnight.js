// @flow

//Register Discord events
import './app/Events.js';

//Start timed events
import './app/Cron.js';

//Start Discord Bot
import DiscordUtils from './app/DiscordUtils';
DiscordUtils.start();

//Start express
import './app/HTTPServer.js';
