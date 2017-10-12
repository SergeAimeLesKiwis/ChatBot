var builder = require('botbuilder');
var restify = require('restify');

// Restify server
var server = restify.createServer();
server.listen(process.env.port || 3978, function(){
    console.log(`Server name: ${server.name} - Server url: ${server.url}`);
});

var connector = new builder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_PASSWORD
});

server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.userData.profile = {};
        session.userData.profile.name = 'azerty';
        session.userData.profile.phoneNumber = '0123456789';
        session.userData.profile.nbPerson = '1';
        session.beginDialog('greetings');
    }
]);

bot.on('conversationUpdate', (message) => {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                let msg = new builder.Message().address(message.address);
                msg.text('Bienvenue sur le bot Résa');
                bot.send(msg);    
            }
        });
    }
});

var menu = {
    'Nom': { dialog: 'askName' },
    'Numéro de téléphone': { dialog: 'askPhoneNumber' },
    'Nombre de personne': { dialog: 'askNbPerson' },
    'Date': { dialog: 'askDate' },
    'Valider': { dialog: 'validate' }
}

bot.dialog('greetings',[
    function (session, args) {
        builder.Prompts.choice(session, 'Que voulez-vous faire ?', menu, { listStyle: builder.ListStyle.list });
    },
    function (session, results) {
        if (results.response)
            session.beginDialog(menu[results.response.entity].dialog);
    },
    function (session, results) {
        session.beginDialog('greetings');
    }
]).triggerAction({
    matches: /^menu$/i,
    confirmPrompt: 'Revenir au menu ?'
});

bot.dialog('askName', [
    function (session) {
        builder.Prompts.text(session, 'Comment vous appelez-vous ?');
    },
    function (session, results) {
        session.userData.profile.name = results.response;
        session.endDialogWithResult(results);
    }
]);

bot.dialog('askPhoneNumber', [
    function (session, args) {
        if (args && args.retry)
            builder.Prompts.text(session, 'Quel est votre numéro de téléphone ? (Format : 06 58 71 92 04 ou 0658719204)');
        else
            builder.Prompts.text(session, 'Quel est votre numéro de téléphone ?');
    },
    function (session, results) {
        var matched = results.response.match(/\d+/g);
        var number = matched ? matched.join('') : '';

        if (number.length == 10) {
            session.userData.profile.phoneNumber = number;
            session.endDialogWithResult(results);
        } else
            session.replaceDialog('askPhoneNumber', { retry: true });
    }
]);

bot.dialog('askNbPerson', [
    function (session) {
        builder.Prompts.number(session, 'Pour combien de personnes voulez-vous réserver ?');
    },
    function (session, results) {
        session.userData.profile.nbPerson = results.response;
        session.endDialogWithResult(results);
    }
]);

bot.dialog('askDate', [
    function (session) {
        builder.Prompts.time(session, 'Pour quelle date ?');
    },
    function (session, results) {
        session.userData.profile.date = formatDate(builder.EntityRecognizer.resolveTime([results.response]));
        session.endDialogWithResult(results);
    }
]);

bot.dialog('validate', [
    function (session) {
        var name = session.userData.profile.name;
        var phoneNumber = session.userData.profile.phoneNumber;
        var nbPerson = session.userData.profile.nbPerson;
        var date = session.userData.profile.date;

        if (name && phoneNumber && nbPerson && date) {
            session.send(`Vous souhaitez réserver pour ${nbPerson} personne(s) le ${date} au nom de ${name}, votre numéro de téléphone est le ${phoneNumber}.`)
            builder.Prompts.confirm(session, 'Êtes-vous sûr ?');
        } else {
            session.endDialog('Il manque des informations !');
        }
    },
    function (session, results) {
        session.send('Votre réservation a bien été prise en compte ! Merci de votre confiance.')
        session.endConversation();
    }
]);

function formatDate(date) {
    return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
}