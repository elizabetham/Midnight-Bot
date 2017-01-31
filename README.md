# Midnight

*Midnight is a custom written [Discord](https://discordapp.com/) Bot for [MuselK](https://www.youtube.com/user/MrMuselk)'s Discord Guild "The Convicts", currently maintained by [@BeMacized](http://github.com/BeMacized)*


### Main functionality

- Provides Interactive jukebox system
- Filters chat automatically
- Moderates guild automatically
- Provides manual moderation tools

### Notable Dependencies
- **React, Flux, Material-UI and Bootstrap** for Web Interface
- **Mocha, Chai & Supertest** for unit tests
- **Webpack & Babel** for transpiling **ES2017** code.
- **Express** for hosting frontend and REST API.
- **Discord.JS** for Discord interaction
- **Flowtype** for static type checking
- **Chart.JS** for pretty statistics

### Command usage

|Command|Usage|Description|Aliases|
| --- | --- | --- | --- |
|!**help**|*!help [command]*|List Midnight's help|
|!**queue**|*!queue \<youtubeURL\|searchQuery\>*|Add a track to the queue|play
|!**dequeue**|*!dequeue [#\|all]*|Remove a specific- or your last queued track from the queue.|unqueue
|!**downvote**|*!downvote*|Downvote the currently playing track|down
|!**upvote**|*!upvote*|Upvote the currently playing track|up
|!**blacklist**|*!blacklist \<add/remove\> \<youtubeURL\>*|Add or remove a track from the permanent blacklist|
|!**skip**|*!skip*|Skip the currently playing track|
|!**ban**|*!ban \<user\> [[for]reason]*|Ban a guild member permanently|
|!**unban**|*!unban \<user\> [[for]reason]*|Unban a banned guild member|
|!**mute**|*!mute \<user\> \<duration\|forever\> [[for]reason]*|Mute a guild member for a specific period of time|
|!**unmute**|*!unmute \<user\>*|Unmute a muted guild member|
|!**restart**|*!restart*|Make Midnight restart herself.|
|!**game**|*!game [status]*|Set Midnight's game status|
|!**dbtools**|*!dbtools*|Database related administration tools|db

### Requirements

 - Node `>=6.0.0`
 - An installation of NPM
 - A MongoDB instance `>=3.20`;
 - A Redis instance
 - A Discord Bot token
 - An API key for the Youtube Data API (Optional)
 - A Pastebin API key for error reporting (Optional)

### Configuration

**NOTE:** The method Midnight's configured is scheduled for change at a later moment. The current solution isn't very pretty.

Before building the application, a file named `config.js` should be placed in the root directory of the project, alongside `Midnight.js`. It is important to mixin `/shared_src/publicConfig`.

Example configuration:
```javascript
let config = {};

//Mixin the public configuration
import publicConfig from './shared_src/publicConfig';
config = Object.assign({}, publicConfig);

//MISC SETTINGS

//A pastebin key for quick error reporting in the bot log channel (Optional)
config.PASTEBIN_DEV_KEY = 'YOUR_PASTEBIN_KEY';
//Your MongoDB connection details
config.database = "mongodb://user:password@host:port/db";

//MUSIC SETTINGS

//Your youtube api key to enable search for jukebox (Optional)
config.YOUTUBE_API_KEY = 'YOUR_GOOGLE_API_LEY';
//The voice channel to play music in  (Optional)
config.MUSIC_VOICE_CHANNEL = "VOICE_CHANNEL_ID";
//The voice channel users can control the music functionality in (Optional)
config.MUSIC_CONTROL_CHANNEL = "CONTROL_CHANNEL_ID";
config.MUSIC_IDLE_PLAYLIST = ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"];

//EXPRESS SETTINGS

//The port to start express on
config.HTTP_PORT = 8080;
//Whether to allow Cross Origin Resource Sharing
config.allowCORS = false; //Recommended to leave at 'false'

//DISCORD SETTINGS

//Name of the bot logs channel
config.botLogChannel = 'bot-logs';
//Name of the mod logs channel
config.botModChannel = 'mod-logs';
//Default game status message
config.playing = 'with banhammers';
//Your Discord bot token
config.botToken = "YOUR_BOT_TOKEN";

//MODERATION SETTINGS

//The delay in seconds for user's notoriety levels to drop
config.levelDrop = 86400 * 2;
//A list of role ID's to be exempt from chat filters
config.whitelistedRoles = ["248019311090728961"];

export default config;
```


### Scripts

- `npm run init`: Initialize the project, installs dependencies & fetches flow libdefs.
- `npm run test`: Runs unit tests & checks for flow errors.
- `npm run test-jenkins`: Similar to `npm run test` but with a mocha test reporter compatible with Jenkins for continuous integration.
- `npm run build`: Build for production.
- `npm run start`: Build for production and run the output.
- `npm run debug`: Run Midnight in debug mode for development purposes.
- `npm run debug:server`: Run Midnight in debug mode without the Web UI.
- `npm rub debug:client`: Run Midnight's Web UI exclusively, in debug mode.


### Contributors & Credits

- [**@BeMacized**](https://github.com/BeMacized)
- [**@LWTechGaming**](https://github.com/LWTechGaming)

### Running Midnight

**Initial setup:**

- Set up your MongoDB and Redis instances
- Clone the Midnight repository
```
$ git clone https://github.com/BeMacized/Midnight-Bot.git midnight && cd midnight
```
- Fetch required dependencies
```
$ npm run init
```
- Write your config file and place it in the project directory alongside Midnight.js
- Run tests to make sure your configuration is correct:
```
$ npm run test
```
- Build Midnight:
```
$ npm run build
```

**Start Midnight**

Execute:
```
$ cd dist && node Midnight.js
```
Please note that in order for the `!restart` command to start the bot back up, it is required to use an external runner like [PM2](https://github.com/Unitech/pm2). In case you use PM2, replace `node Midnight.js` with `pm2 start Midnight.js`.


### Contributing
1. [Check for open issues](https://github.com/BeMacized/Midnight-Bot/issues) at the project issue page or open a new issue to start a discussion about a feature or bug.
2. Fork the [Midnight repository](https://github.com/BeMacized/Midnight-Bott) on GitHub to start making changes.
3. Add a test case to show that the bug is fixed or the feature is implemented correctly. Bug me until I can merge your pull request.

### Contact
- Visit our [Discord Guild](https://discord.gg/gpQMmUD)
- Send me a message on [Twitter: @BeMacized](http://twitter.com/BeMacized)

### License
Midnight, Copyright (C) 2017 Bodhi Mulders

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
