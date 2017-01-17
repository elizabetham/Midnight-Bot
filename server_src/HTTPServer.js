// @flow

//Modules
import {UserRecord, InfractionRecord} from './DBManager';
import DiscordUtils from './DiscordUtils';
import Logging from './Logging';

//Routers
import apiRouter from './routers/APIRouter';

//Config
import Config from '../config';

//Dependencies
import express from 'express';

//Types
import type {$Request, $Response}
from 'express';

//Initialize express
const app = express();

//Allow CORS
if (Config.allowCORS) {
    console.log("Warning: Allowing CORS!");
    app.use(require("cors")());
}

//Add API router;
app.use('/api', apiRouter);

//Reference static content
import path from 'path';
app.use(express.static('res/htdocs'));
app.get('*', (req : $Request, res : $Response) => {
    console.log("DIRNAME", __dirname);
    res.sendFile('res/htdocs/index.html', {root: __dirname});
});

//Start HTTP server
app.listen(Config.HTTP_PORT, () => {
    console.log("Express listening on port " + Config.HTTP_PORT);
});
