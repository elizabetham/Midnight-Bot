// @flow

//Modules
import {UserRecord, InfractionRecord} from '../utils/DBManager';
import DiscordUtils from '../utils/DiscordUtils';
import Logging from '../utils/Logging';

//Routers
import apiRouter from './routers/APIRouter';

//Config
import Config from '../../config';

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
    try {
        res.sendFile('res/htdocs/index.html', {root: __dirname});
    } catch (e) {
        res.status(404).json({error: "Frontend not yet installed."});
    }
});

export default app;
