const {SlashCommandBuilder}=require('@discordjs/builders');
const {
    MessageEmbed, Modal, MessageActionRow, TextInputComponent, MessageButton,
}=require('discord.js');
const chalk=require('chalk');
require("@discord-player/extractor")
const playdl=require("play-dl");

module.exports={
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song!')
        .addStringOption((option) => option
            .setName('song')
            .setRequired(true)
            .setDescription('Song to play')),

    async execute(interaction, client, player) {

        if (!interaction.member.voice.channelId) return await interaction.reply({
            embeds: [{
                title: "You are not in a voice channel!",
                color: 0xFF0000
            }],
            ephemeral: true
        });
        if (interaction.guild.me.voice.channelId&&interaction.member.voice.channelId!==interaction.guild.me.voice.channelId) return await interaction.reply({
            embeds: [{
                title: "You are not in my voice channel!",
                color: 0xFF0000
            }],
            ephemeral: true
        });

        const query=interaction.options.get("song").value;

        const queue=player.createQueue(interaction.guild, {
            metadata: {
                channel: interaction.channel
            },
            spotifyBridge: true,
            async onBeforeCreateStream(track, source, _queue) {
                if (source==="youtube") {
                    return (await playdl.stream(track.url, {discordPlayerCompatibility: true})).stream;
                }
            }
        });
        try {
            if (!queue.connection) await queue.connect(interaction.member.voice.channel);
        } catch {
            queue.destroy();
            return await interaction.reply({
                embeds: [{
                    title: "I could not join your voice channel!",
                    color: 0xFF0000
                }],
                ephemeral: true
            });
        }
        try {
            if (!queue.connection) await queue.connect(interaction.member.voice.channel);
        } catch {
            queue.destroy();
            return await interaction.reply({
                embeds: [{
                    title: "I could not join your voice channel!",
                    color: 0xFF0000
                }],
                ephemeral: true
            });
        }
        await interaction.deferReply({ephemeral: true});
        const track=await player.search(query, {
            requestedBy: interaction.user
        }).then(x => x.tracks[0]);

        if (!track) return await interaction.followUp({
            embeds: [{
                title: "Track not found!",
                color: 0xFF0000,
            }],
            ephemeral: true

        });

        if (track.playlist) {
            queue.addTracks(track.playlist.tracks);
            await interaction.followUp({
                embeds: [{
                    title: "Added playlist to queue!",
                    color: 0x00FF00
                }],
                ephemeral: true
            });
        } else {
          queue.play(track);
            return await interaction.followUp({
                embeds: [{
                    title: `Added to queue:`,
                    fields: [{
                        name: "Song",
                        value: `${ track.title }`,
                        inline: true,
                    }, {
                        name: "Artist",
                        value: `${ track.author }`,
                        inline: false,
                    }, {
                        name: "Requested by",
                        value: `${ track.requestedBy }`,
                        inline: false
                    }],
                    color: 0x00ff00,
                    thumbnail: {
                        url: track.thumbnail,
                    },
                    footer: {
                        text: `Duration: ${ track.duration } | Views: ${ track.views }`,
                    },
                }],

                ephemeral: true
            });
        }
       if(!queue.playing) await queue.play();
    },
};
