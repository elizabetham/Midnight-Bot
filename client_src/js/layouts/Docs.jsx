// @flow
//Dependencies
import React, {Component} from 'react';

import '../../css/docs.css';
import {Grid, Row, Col} from 'react-bootstrap';

class DocsLayout extends Component {

    render() {

        const style = {
            layout: {
                padding: "48px 72px 48px 72px",
                width: "100%",
                margin: "0 auto",
                maxWidth: "1154px"
            },
            imgLeft: {
                display: "block",
                margin: "0 15px 15px 0",
                float: "left"
            },
            imgRight: {
                display: "block",
                margin: "0 0 15px 15px",
                float: "right"
            },
            commandHeader: {
                display: "inline-block",
                margin: "0",
                padding: "0"
            }
        };

        return (
            <div style={style.layout}>
                <Row>
                    <h2>Midnight Documentation</h2>
                    <p>Below you'll find documentation on how to make use of Midnight's feature set.</p>
                </Row>
                <Row>
                    <h3>Command usage</h3>
                    <p>You can prefix a command to Midnight either with &nbsp;<code>!</code>, or a Discord mention &nbsp;<code>@Midnight</code>.
                        <br/>
                        Parameters surrounded with &nbsp;<code>&lt;&nbsp;&gt;</code>&nbsp; are mandatory. Those surrounded with &nbsp;<code>[ ]</code>&nbsp; are optional. Do not type these braces into your actual commands.
                    </p>
                </Row>
                <Row>
                    <h3>Referencing users</h3>
                    <p>
                        <img className="img-thumbnail" style={style.imgLeft} src="http://i.imgur.com/llsZLSD.png"/>
                        Some commands require a reference to a user in order to act upon that user. Normally you can reference a user by just using a regular Discord mention.
                        <br/>
                        <br/>
                        To reference users that are not currently a member of the guild, either use their plain UID as a replacement, or use
                        <code>&lt;@USERID&gt;</code>
                        , where you replace
                        <code>USERID</code>
                        with the user's ID. An example would be like the following:
                        <pre>
                            @Midnight mute &lt;@156504894604312577&gt; 5 days for spamming profanity
                        </pre>
                        You can obtain this ID by right clicking a user in another guild and choosing
                        <code>Copy ID</code>. Note that this option only appears if your Discord client is set to Developer mode.
                    </p>
                </Row>
                <Row>
                    <h3>Developer mode</h3>
                    <img className="img-thumbnail" style={style.imgRight} src="http://i.imgur.com/NhIRZwd.png"/>
                    <p>You can activate Developer mode by going into your Discord client's settings, and checking "Developer Mode" in the "Appearance" tab.
                    </p>
                    <hr/>
                </Row>
                <Row>
                    <h2>Commands</h2>
                </Row>
                <Row>
                    <hr/>
                    <h3>Music</h3>
                </Row>
                <Row>
                    <hr/>
                    <h3 style={style.commandHeader}>!play</h3>
                    <h5 style={style.commandHeader}>
                        &nbsp;- Queue a song for the music voice chat.</h5>
                    <h5>Usage:
                        <code>!play &lt;youtubeURL/searchQuery&gt;</code>
                    </h5>
                    <p>Minimum role required:&nbsp;<code>Platinum Peep</code>
                    </p>
                    <p>You can either supply a valid URL to a youtube video, or you can just type in a search query and Midnight will pick the best result.</p>
                </Row>
                <Row>
                    <hr/>
                    <h3 style={style.commandHeader}>!skip</h3>
                    <h5 style={style.commandHeader}>
                        &nbsp;- Skip the currently playing song</h5>
                    <h5>Usage:
                        <code>!skip</code>
                    </h5>
                    <p>Minimum role required:&nbsp;<code>Platinum Peep</code>
                    </p>
                </Row>
                <Row>
                    <hr/>
                    <h3 style={style.commandHeader}>!playlist</h3>
                    <h5 style={style.commandHeader}>
                        &nbsp;- Show the currently queued songs</h5>
                    <h5>Usage:
                        <code>!playlist</code>
                    </h5>
                    <p>Minimum role required:&nbsp;<code>Platinum Peep</code>
                    </p>
                </Row>
                <Row>
                    <hr/>
                    <h3>Moderation</h3>
                </Row>
                <Row>
                    <hr/>
                    <h3 style={style.commandHeader}>!mute</h3>
                    <h5 style={style.commandHeader}>
                        &nbsp;- Manually mute a user.</h5>
                    <h5>Usage:
                        <code>!mute &lt;user&gt; &lt;duration&gt; [[for]reason]</code>
                    </h5>
                    <p>Minimum role required:&nbsp;<code>Moderator</code>
                    </p>
                    <p>The &nbsp;<i>duration</i>&nbsp; parameter expects a combination of a numeric value and a time unit. Here are a few examples:
                        <pre>
                            @Midnight mute @BeMacized 5 days for being inconsiderate<br/>
                            @Midnight mute @BeMacized 2 hours for posting scam content<br/>
                            @Midnight mute @BeMacized 1 week for linking inappropriate content
                        </pre>
                        The following time units are available: &nbsp;<code>seconds, minutes, hours, days, weeks, months</code>.<br/>
                        You can use &nbsp;<code>forever</code>
                        instead of a regular duration in case you want to issue a permanent mute.
                    </p>
                </Row>
                <Row>
                    <hr/>
                    <h3 style={style.commandHeader}>!unmute</h3>
                    <h5 style={style.commandHeader}>
                        &nbsp;- Manually lift a mute.</h5>
                    <h5>Usage:
                        <code>!unmute &lt;user&gt;</code>
                    </h5>
                    <p>Minimum role required:&nbsp;<code>Moderator</code>
                    </p>
                </Row>
                <Row>
                    <hr/>
                    <h3 style={style.commandHeader}>!ban</h3>
                    <h5 style={style.commandHeader}>
                        &nbsp;- Manually ban a user permanently.</h5>
                    <h5>Usage:
                        <code>!ban &lt;user&gt; [[for]reason]</code>
                    </h5>
                    <p>Minimum role required:&nbsp;<code>Moderator</code>
                    </p>
                </Row>
                <Row>
                    <hr/>
                    <h3 style={style.commandHeader}>!unban</h3>
                    <h5 style={style.commandHeader}>
                        &nbsp;- Manually unban a user.</h5>
                    <h5>Usage:
                        <code>!unban &lt;user&gt; [[for]reason]</code>
                    </h5>
                    <p>Minimum role required:&nbsp;<code>Moderator</code>
                    </p>
                </Row>
                <Row>
                    <hr/>
                    <h3>Administration</h3>
                </Row>
                <Row>
                    <hr/>
                    <h3 style={style.commandHeader}>!game</h3>
                    <h5 style={style.commandHeader}>
                        &nbsp;- Set Midnight's 'game' status.</h5>
                    <h5>Usage:
                        <code>!game [status]</code>
                    </h5>
                    <p>Minimum role required:&nbsp;<code>Master Moderator</code>
                    </p>
                    <p>In case of no status being provided, the game status shall be cleared</p>
                </Row>
                <Row>
                    <hr/>
                    <h3 style={style.commandHeader}>!restart</h3>
                    <h5 style={style.commandHeader}>
                        &nbsp;- Make Midnight restart herself.</h5>
                    <h5>Usage:
                        <code>!restart</code>
                    </h5>
                    <p>Minimum role required:&nbsp;<code>Master Moderator</code>
                    </p>
                </Row>

            </div>
        );
    }
}

export default DocsLayout;
