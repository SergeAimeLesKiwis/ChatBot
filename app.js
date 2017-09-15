var builder = require('botbuilder');
var restify = require('restify');

var server = restify.createServer();
server.listen(process.env.port || 3978, function () {
    console.log(`Server name : ${server.name} - Server url : ${server.url}`);
});

var connector = new builder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_PWD
});

server.post(`/api/messages`, connector.listen());

var bot = new builder.UniversalBot(connector, function (session) {

    bot.on(`conversationUpdate`, function () {
        session.send(`Welcome to blah blah blah, I'll be your guide !`);
    });

    bot.on(`typing`, function () {
        session.send(`Write faster ...`);
    });

    session.send(`Character count : ${session.message.text.length}`);
    session.send(`Dialog data : ${JSON.stringify(session.dialogData)}`);

});