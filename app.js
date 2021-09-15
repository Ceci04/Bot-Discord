// Imports
const Discord = require('discord.js');
const cliente = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
const ytdl = require('ytdl-core');
// Config
const {
    prefijo,
    token,
} = require('./config/config.json');

const cola = new Map();

// Estados del bot
cliente.once('ready', () => { console.log('Listo!'); });
cliente.once('reconnecting', () => { console.log('Reconectando!'); });
cliente.once('disconnect', () => { console.log('Desconectado!'); });

// Evento que se ejecuta al recibir un mensaje en el servidor
cliente.on('message', async (msg) => {
    // Check: Si el bot es el autor del mensaje
    if (msg.author.bot) return;
    // Check: Si el mensaje no contiene el prefijo
    let contenido = msg.content;
    if (!contenido.startsWith(prefijo)) return;

    const colaServidor = cola.get(msg.guild.id);
    // Check: Si el mensaje contiene el prefijo
    if (contenido.startsWith(`${prefijo}play`)) {
        ejecutar(msg, colaServidor);
        return;
    } else if (contenido.startsWith(`${prefijo}skip`)) {
        skip(msg, colaServidor);
        return;
    } else if (contenido.startsWith(`${prefijo}stop`)) {
        stop(msg, colaServidor);
        return;
    } else {
        msg.channel.send('**El comando que has introducido no es válido.**');
    }
});

// Funcion que ejecutara las canciones
async function ejecutar(msg, colaServidor) {
    const args = msg.content.split(" ");
    // Check: Si el usuario que ha invocado el bot se encuentra en un canal de voz
    const canalVoz = msg.member.voice.channel;
    if (!canalVoz) {
        return msg.channel.send('**¡Necesitas estar en un canal de voz para reproducir música!**');
    }
    // Check: Si el usuario que ha invocado el bot cuenta con los permisos suficientes
    const permisos = canalVoz.permissionsFor(msg.client.user);
    if (!permisos.has('CONNECT') || !permisos.has("SPEAK")) {
        return msg.channel.send('**¡Necesito los permisos de conectar y hablar en este canal de voz!**');
    }

    // Almacenamos la info de la cancion utilizando el modulo ytdl
    const cancionInfo = await ytdl.getInfo(args[1]);
    const cancion = {
        titulo: cancionInfo.videoDetails.title,
        url: cancionInfo.videoDetails.video_url
    };

    if (!colaServidor) {

    } else {
        colaServidor.canciones.push(cancion);
        console.log(colaServidor.canciones);
        return msg.channel.send(`${cancion.titulo} se ha añadido a la cola!`);
    }

    // Creamos el contrato para la cola
    const colaConstructor = {
        canalTexto: msg.channel,
        canalVoz: canalVoz,
        conexion: null,
        canciones: [],
        volumen: 5,
        reproduciendo: true
    };

    // Seteamos la cola utilizando el contrato
    cola.set(msg.guild.id, colaConstructor);
    // Añadimos la cancion a la cola
    colaConstructor.canciones.push(cancion);

    try {
        // Conexion al canal de voz
        let conexion = await canalVoz.join();
        colaConstructor.conexion = conexion;
        // Llamamos a la funcion para que inicie la reproducción
        play(msg.guild, colaConstructor.canciones[0]);
    } catch (err) {
        console.log(err);
        cola.delete(msg.guild.id);
        return msg.channel.send(err);
    }
}

function play(guild, cancion) {
    const colaServidor = cola.get(guild.id);
    if (!cancion) {
        colaServidor.canalVoz.leave();
        cola.delete(guild.id);
        return;
    }

    const transmision = colaServidor.conexion
        .play(ytdl(cancion.url))
        .on('finish', () => {
            colaServidor.canciones.shift();
            play(guild, colaServidor.canciones[0]);
        })
        .on('error', err => console.error(err));
    // Volumen divido entre 5 sino se escucha mal
    transmision.setVolumeLogarithmic(colaServidor.volumen / 5);
    colaServidor.canalTexto.send(`Reproduciendo: **${cancion.titulo}**`);
}

// Funcion saltar
function skip(msg, colaServidor) {
    // Check: Si el usuario esta en el canal de voz
    if (!msg.member.voice.channel) {
        return msg.channel.send('**¡Necesitas estar en un canal de voz para saltar la cancion!**');
    }
    // Check: Si hay mas canciones en la cola del servidor
    if (!colaServidor) {
        return msg.channel.send('**¡No hay canciones que se puedan saltar!**');
    }
    colaServidor.conexion.player.dispatcher.end();
}

// Funcion parar
function stop(msg, colaServidor) {
    // Check: Si el usuario esta en el canal de voz
    if (!msg.member.voice.channel) {
        return msg.channel.send('**¡Necesitas estar en un canal de voz para parar la cancion!**');
    }
    // Check: Si hay mas canciones en la cola del servidor
    if (!colaServidor) {
        return msg.channel.send('**¡No hay canciones que se puedan parar!**');
    }
    colaServidor.canciones = [];
    colaServidor.conexion.player.dispatcher.end();
}

cliente.login(token);