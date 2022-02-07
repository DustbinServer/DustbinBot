import { Telegraf } from 'telegraf';
import axios from 'axios';
import languages from './languages';
import api from './api';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';

const bot = new Telegraf(String(process.env.botToken));

bot.start(async (ctx) => {
    return ctx.reply(
        'Welcome to *DustbinServer* bot !\nGithub - [DustbinServer](https://github.com/DustbinServer/)',
        {
            parse_mode: 'Markdown',
        },
    );
});

bot.help(async (ctx) => {
    return ctx.reply(
        '*DustbinServer* bot is a simple bot that allows you to paste your code in the [dustbin.me](https://dustbin.me/) server.\n' +
        '\n' +
        '*Commands*:\n' +
        '`/paste <data>` - paste your code\n' +
        '`/get <pasteId>` - get the paste with the specified pasteId\n' +
        'Sending a file is also possible, but the file must be a text file.',
        {
            parse_mode: 'Markdown',
        },
    );
});

bot.command('get', async (ctx) => {
    if (ctx.message.text.split(' ').length != 2) {
        return ctx.reply('Usage: /get <pasteId>');
    }
    const pasteId = ctx.message.text.split(' ')[1];
    const paste: Object | null = await api.getPaste(pasteId);
    if (!paste) {
        return ctx.reply('Paste not found !');
    }
    ctx.replyWithDocument({
        // @ts-ignore
        source: readFileSync(`./${paste.id}`),
        // @ts-ignore
        filename: `${paste.id}.${paste.language}`,
    }, {
        // @ts-ignore
        caption: `💥 *Language* - \`${paste.language}\``,
        parse_mode: 'Markdown',
    });
    // @ts-ignore
    return unlinkSync(`./${paste.id}`);
});

bot.command('paste', async (ctx) => {
    if (!(ctx.message.text.split(' ').length >= 2)) {
        return ctx.reply('Usage: /paste <data>');
    }
    const data = ctx.message.text.replace('/paste ', '');
    writeFileSync(`./${ctx.message.message_id}`, data);
    ctx.telegram.sendDocument(
        ctx.message.chat.id,
        {
            source: readFileSync(`./${ctx.message.message_id}`),
            filename: `temp.txt`,
        },
        {
            reply_to_message_id: ctx.message.message_id,
            caption: '💥 Choose Language !',
            reply_markup: {
                inline_keyboard: languages,
            }
        }
    );
    return unlinkSync(`./${ctx.message.message_id}`);
});

bot.on('document', async (ctx) => {
    const req = await axios.get(String(await ctx.telegram.getFileLink(ctx.message.document.file_id)));
    if (!req.data) {
        return ctx.reply('Empty data not allowed !');
    }
    ctx.telegram.sendDocument(
        ctx.message.chat.id,
        ctx.message.document.file_id,
        {
            reply_to_message_id: ctx.message.message_id,
            caption: '💥 Choose Language !',
            reply_markup: {
                inline_keyboard: languages,
            }
        }
    );
});

bot.on('callback_query', async (ctx) => {
    ctx.answerCbQuery('💥 Processing...');
    // @ts-ignore
    const lang = ctx.callbackQuery.data;
    // @ts-ignore
    const paste = await api.newPaste(String(await ctx.telegram.getFileLink(ctx.callbackQuery.message.document.file_id)), lang);
    if (paste) {
        return ctx.reply(
            `💥 Paste created at [${paste}](https://dustbin.me/paste/${paste})\n` +
            `💥 Paste Id: \`${paste}\``,
            {
                parse_mode: 'Markdown',
            },
        );
    }
    return ctx.reply('💥 Error !');
});

export default bot;