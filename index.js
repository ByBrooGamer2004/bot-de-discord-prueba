require('dotenv').config();
const { 
    Client, GatewayIntentBits, Partials, Events, PermissionFlagsBits, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, OverwriteType,
    ModalBuilder, TextInputBuilder, TextInputStyle, ActivityType
} = require('discord.js');

// Configuración del cliente
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel],
});

// ==========================================
// CONFIGURACIÓN DE AUTO-MODERADOR
// ==========================================
const automodConfig = {
    antiLinks: true,         // Bloquear invitaciones de Discord
    antiExternalLinks: true, // Bloquear cualquier otro tipo de link (http/https)
    antiSpam: {
        enabled: true,
        maxMessages: 4,      // Mensajes máximos permitidos
        timeWindowMs: 4000   // Ventana de tiempo en milisegundos (4 segs)
    }
};

const userSpamData = new Map();

// ==========================================
// CONFIGURACIÓN DE TICKETS
// ==========================================
const ticketConfig = {
    // Categoría principal donde se CREARÁN todos los tickets (activos, cerrados, bloqueados)
    categoryId: '1505136155077644379',
    // ID de la Categoría "Archivo" donde se moverán los tickets al cerrarlos (opcional)
    archiveCategoryId: '1505136807124275350',
    // Canal donde se enviarán los resúmenes (logs) al cerrar un ticket
    logChannelId: '1505137024171114526',
    // Si tienes un rol de "Soporte" que debe ver los tickets, pon su ID aquí (opcional)
    supportRoleId: '',
};

client.once(Events.ClientReady, async c => {
    console.log(`✅ ¡Bot listo! Conectado como ${c.user.tag}`);
});

// ==========================================
// AUTO-MODERADOR E INTERCEPCIÓN DE MENSAJES
// ==========================================
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    // ----------------------------------------
    // AUTO-MODERADOR (Ignora a administradores)
    // ----------------------------------------
    if (message.member && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        
        let messageDeleted = false;

        // 1. Filtro Anti-Links de Discord
        if (automodConfig.antiLinks) {
            const hasDiscordLink = /discord(?:app)?\.(?:com\/invite|gg)\/[a-zA-Z0-9]+/i.test(message.content);
            if (hasDiscordLink) {
                await message.delete().catch(() => {});
                messageDeleted = true;
                return message.channel.send(`⚠️ <@${message.author.id}>, ¡No está permitido enviar invitaciones a otros servidores!`).then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
            }
        }

        // 1.5 Filtro de cualquier enlace externo HTTP/HTTPS
        if (automodConfig.antiExternalLinks && !messageDeleted) {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = message.content.match(urlRegex);
            
            if (urls) {
                // Permitimos URLs de Tenor, Giphy o attachments de Discord para que los gifs nativos no se bloqueen
                const isOnlyGifs = urls.every(url => url.includes('tenor.com') || url.includes('giphy.com') || url.includes('discordapp.com/attachments') || url.includes('discordapp.net/attachments'));
                
                if (!isOnlyGifs) {
                    await message.delete().catch(() => {});
                    messageDeleted = true;
                    return message.channel.send(`🔗 <@${message.author.id}>, ¡No está permitido enviar links o publicidad externa!`).then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
                }
            }
        }

        // 2. Filtro Anti-Spam (Si el mensaje no fue borrado por links, verificamos spam)
        if (automodConfig.antiSpam.enabled && !messageDeleted) {
            const now = Date.now();
            if (!userSpamData.has(message.author.id)) {
                userSpamData.set(message.author.id, []);
            }
            
            const userHistory = userSpamData.get(message.author.id);
            userHistory.push(now);

            // Rastrear solo el historial dentro de la última ventana temporal
            const recentMessages = userHistory.filter(stamp => now - stamp < automodConfig.antiSpam.timeWindowMs);
            userSpamData.set(message.author.id, recentMessages);

            if (recentMessages.length > automodConfig.antiSpam.maxMessages) {
                await message.delete().catch(() => {});
                
                // Vaciar su historial para no bugearlo ni llenarle la pantalla de infinitas advertencias
                userSpamData.set(message.author.id, []);

                return message.channel.send(`🛑 <@${message.author.id}>, estás enviando mensajes demasiado rápido. ¡Cálmate un poco!`).then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
            }
        }
    }

    // ----------------------------------------
    // COMANDOS DE TICKETS
    // ----------------------------------------
    // Comando para enviar el Panel de Tickets
    if (message.content === '!panel-tickets') {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('⚠️ No tienes permisos para crear el panel.');
        }

        const panelEmbed = new EmbedBuilder()
            .setColor('#2e82ff')
            .setTitle('🎫 Support & Help')
            .setDescription('If you have a question, issue, or need assistance, click the button below to open a ticket. The administrators will assist you privately.');

        const button = new ButtonBuilder()
            .setCustomId('btn_crear_ticket')
            .setLabel('Open Ticket 🎫')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        return message.channel.send({ embeds: [panelEmbed], components: [row] });
    }
});

// ==========================================
// INTERACCIONES Y BOTONES DE TICKET
// ==========================================
client.on(Events.InteractionCreate, async interaction => {
    // Manejo de Modales (Formularios) primero
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_close_ticket') {
            const reason = interaction.fields.getTextInputValue('input_reason');
            const solved = interaction.fields.getTextInputValue('input_solved');
            
            await interaction.reply('🔒 Saving record and archiving the ticket...');
            
            const logChannel = interaction.guild.channels.cache.get(ticketConfig.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#e67e22') // Naranja
                    .setTitle('📄 Closed Ticket Report')
                    .addFields(
                        { name: 'Original Channel', value: interaction.channel.name, inline: true },
                        { name: 'Closed by', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Solved?', value: solved, inline: true },
                        { name: 'Reason / Context', value: reason, inline: false }
                    )
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }

            // Flujo original de archivar
            try {
                const overwrites = interaction.channel.permissionOverwrites.cache.filter(ow => ow.type === OverwriteType.Member);
                for (const [id, overwrite] of overwrites) {
                    if (id !== interaction.client.user.id) {
                        await overwrite.delete().catch(console.error); // Evitar cuelgues si no puede borrar al Owner del server
                    }
                }
                
                let currentName = interaction.channel.name;
                if (currentName.startsWith('ticket-')) {
                    await interaction.channel.setName(`closed-${currentName.substring(7)}`).catch(console.error);
                }

                if (ticketConfig.archiveCategoryId) {
                    await interaction.channel.setParent(ticketConfig.archiveCategoryId, { lockPermissions: false }).catch(console.error);
                }
            } catch (error) {
                console.error('Error archivando permisos o nombre:', error);
            }

            // Garantizamos que el panel se envíe siempre, separándolo de posibles fallos de permisos previos
            try {
                const deleteEmbed = new EmbedBuilder()
                    .setColor('#ff4747')
                    .setTitle('🗑️ Manage Archived Ticket')
                    .setDescription('This ticket is now closed and hidden from the user.\nYou can leave it here, or permanently delete the channel.');
                
                const deleteBtn = new ButtonBuilder()
                    .setCustomId('btn_delete_ticket')
                    .setLabel('Delete Ticket 🗑️')
                    .setStyle(ButtonStyle.Danger);

                const delRow = new ActionRowBuilder().addComponents(deleteBtn);

                await interaction.channel.send({ embeds: [deleteEmbed], components: [delRow] });
                
            } catch (error) {
                console.error('Error enviando boton de borrar ticket:', error);
            }
        }
        return;
    }

    if (!interaction.isButton()) return;

    if (interaction.customId === 'btn_crear_ticket') {
        const guild = interaction.guild;
        
        // Creamos el canal de texto para el ticket
        try {
            const channel = await guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: ticketConfig.categoryId || null, // Lo coloca en una categoría si se especificó
                permissionOverwrites: [
                    {
                        id: guild.id, // el @everyone
                        deny: [PermissionFlagsBits.ViewChannel], // Nadie puede ver el canal
                    },
                    {
                        id: interaction.user.id, // Solo el creador
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                    },
                    {
                        id: guild.client.user.id, // El bot
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
                    }
                ],
            });

            // Si hay rol de soporte, darle permiso también (opcional)
            if (ticketConfig.supportRoleId) {
                await channel.permissionOverwrites.create(ticketConfig.supportRoleId, {
                    ViewChannel: true,
                    SendMessages: true
                });
            }

            // Responder temporalmente al usuario que clickeó el botón para que vea el link del nuevo canal
            await interaction.reply({ content: `✅ Tu ticket ha sido creado en <#${channel.id}>`, ephemeral: true });

            // Enviar mensaje de bienvenida en el nuevo ticket con el botón de cerrar
            const ticketEmbed = new EmbedBuilder()
                .setColor('#2e82ff')
                .setTitle('Support Ticket')
                .setDescription(`Hello <@${interaction.user.id}>! An administrator will assist you shortly. Please go ahead and indicate your problem or question below in as much detail as possible.\n\nTo close this ticket, click the button below.`);

            const closeButton = new ButtonBuilder()
                .setCustomId('btn_cerrar_ticket')
                .setLabel('Close Ticket 🔒')
                .setStyle(ButtonStyle.Danger);

            const claimButton = new ButtonBuilder()
                .setCustomId('btn_claim_ticket')
                .setLabel('Claim Ticket ✋')
                .setStyle(ButtonStyle.Primary);

            const lockButton = new ButtonBuilder()
                .setCustomId('btn_lock_ticket')
                .setLabel('Lock Ticket 🛑')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(closeButton, claimButton, lockButton);

            await channel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [row] });
            
        } catch (error) {
            console.error('Error creando ticket:', error);
            await interaction.reply({ content: '⚠️ There was an error creating your ticket. Make sure the bot has the Administrator role.', ephemeral: true });
        }
    }

    if (interaction.customId === 'btn_claim_ticket') {
        const hasAdmin = interaction.member.permissions.has('Administrator');
        const hasSupportRole = ticketConfig.supportRoleId && interaction.member.roles.cache.has(ticketConfig.supportRoleId);
        if (!hasAdmin && !hasSupportRole) {
            return interaction.reply({ content: '⚠️ Only administrators and support staff can claim tickets.', ephemeral: true });
        }

        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        embed.addFields({ name: 'Claimed By', value: `<@${interaction.user.id}>` });
        embed.setColor('#2ecc71'); // Color verde

        const actionRow = ActionRowBuilder.from(interaction.message.components[0]);
        actionRow.components[1].setDisabled(true).setLabel('Claimed ✔️');

        await interaction.update({ embeds: [embed], components: [actionRow] });
    }

    if (interaction.customId === 'btn_lock_ticket' || interaction.customId === 'btn_unlock_ticket') {
        const hasAdmin = interaction.member.permissions.has('Administrator');
        const hasSupportRole = ticketConfig.supportRoleId && interaction.member.roles.cache.has(ticketConfig.supportRoleId);
        if (!hasAdmin && !hasSupportRole) {
            return interaction.reply({ content: '⚠️ Only administrators and support staff can lock/unlock tickets.', ephemeral: true });
        }

        const isLocking = interaction.customId === 'btn_lock_ticket';
        
        if (isLocking) {
            await interaction.channel.setTopic(`locked_by:${interaction.user.id}`);
            const actionRow = ActionRowBuilder.from(interaction.message.components[0]);
            actionRow.components[2].setCustomId('btn_unlock_ticket').setLabel('Unlock Ticket 🔓').setStyle(ButtonStyle.Success);
            
            await interaction.update({ components: [actionRow] });
            await interaction.followUp({ content: `🛑 Ticket locked by <@${interaction.user.id}>. Nobody else can close it now.`, ephemeral: false });
        } else {
            const topic = interaction.channel.topic || '';
            const lockedBy = topic.replace('locked_by:', '');
            
            if (lockedBy && lockedBy !== interaction.user.id && !interaction.member.permissions.has('Administrator')) {
                return interaction.reply({ content: `⚠️ Only the admin who locked it (<@${lockedBy}>) can unlock it.`, ephemeral: true });
            }

            await interaction.channel.setTopic('');
            const actionRow = ActionRowBuilder.from(interaction.message.components[0]);
            actionRow.components[2].setCustomId('btn_lock_ticket').setLabel('Lock Ticket 🛑').setStyle(ButtonStyle.Secondary);
            
            await interaction.update({ components: [actionRow] });
            await interaction.followUp({ content: `🔓 Ticket unlocked by <@${interaction.user.id}>.`, ephemeral: false });
        }
    }

    if (interaction.customId === 'btn_cerrar_ticket') {
        const hasAdmin = interaction.member.permissions.has('Administrator');
        const hasSupportRole = ticketConfig.supportRoleId && interaction.member.roles.cache.has(ticketConfig.supportRoleId);

        if (!hasAdmin && !hasSupportRole) {
            return interaction.reply({ content: '⚠️ Only administrators and support staff can close this ticket.', ephemeral: true });
        }

        const topic = interaction.channel.topic || '';
        if (topic.startsWith('locked_by:')) {
            const lockedBy = topic.replace('locked_by:', '');
            if (lockedBy !== interaction.user.id) {
                return interaction.reply({ content: `⚠️ This ticket is locked by <@${lockedBy}>. You cannot close it.`, ephemeral: true });
            }
        }

        const confirmBtn = new ButtonBuilder().setCustomId('btn_confirm_close').setLabel('Confirm Close ✔️').setStyle(ButtonStyle.Danger);
        const cancelBtn = new ButtonBuilder().setCustomId('btn_cancel_close').setLabel('Cancel').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

        await interaction.reply({ content: '❓ Are you sure you want to close and archive this ticket?', components: [row], ephemeral: true });
    }

    if (interaction.customId === 'btn_cancel_close') {
        await interaction.update({ content: '❌ Ticket closure cancelled.', components: [] });
    }

    if (interaction.customId === 'btn_delete_ticket') {
        const hasAdmin = interaction.member.permissions.has('Administrator');
        const hasSupportRole = ticketConfig.supportRoleId && interaction.member.roles.cache.has(ticketConfig.supportRoleId);

        if (!hasAdmin && !hasSupportRole) {
            return interaction.reply({ content: '⚠️ Only administrators and support staff can fully delete this ticket.', ephemeral: true });
        }

        await interaction.reply('🗑️ Deleting ticket in 5 seconds...');
        setTimeout(() => {
            interaction.channel.delete().catch(console.error);
        }, 5000);
    }

    if (interaction.customId === 'btn_confirm_close') {
        // En vez de archivar directo, abrimos el modal
        const modal = new ModalBuilder()
            .setCustomId('modal_close_ticket')
            .setTitle('Ticket Closure Log');

        const reasonInput = new TextInputBuilder()
            .setCustomId('input_reason')
            .setLabel('What was the problem and/or solution?')
            .setStyle(TextInputStyle.Paragraph) // Campo grande de texto
            .setRequired(true);

        const solvedInput = new TextInputBuilder()
            .setCustomId('input_solved')
            .setLabel('Was the problem solved? (Yes/No)')
            .setStyle(TextInputStyle.Short) // Linea corta de texto
            .setRequired(true)
            .setMaxLength(20);

        const row1 = new ActionRowBuilder().addComponents(reasonInput);
        const row2 = new ActionRowBuilder().addComponents(solvedInput);
        modal.addComponents(row1, row2);

        // Borrar el mensaje efímero de "¿Estás seguro?" no es fácil porque es interactivo, 
        // pero podemos simplemente mostrar el modal encima.
        await interaction.showModal(modal);
    }
});

// Iniciamos sesión con el token guardado en .env
client.login(process.env.DISCORD_TOKEN);
