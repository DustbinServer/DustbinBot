import bot from './src/bot';

(async () => {
    bot.launch();
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
    console.log('[INFO] Dustbin Bot initialized');
})();