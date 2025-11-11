const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// Настройки
const BOT_TOKEN = process.env.BOT_TOKEN || '8532887348:AAFUXtJDr4QQoLW3Hw2hPoY23jBD-5PWEXA';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '129488879';

// Создаем бота
const bot = new TelegramBot(BOT_TOKEN);

// Настройка команд бота
bot.setMyCommands([
  {
    command: '/start',
    description: '🚀 Начать работу с ботом'
  }
]);

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  const welcomeText = `🎄 *Добро пожаловать, я - бот PR-Елки!*\n\nВ этом году конференции *10 лет*.\n\nМы хотим сделать подборку фотографий за все время существования PR-Елки. Присылайте мне фото, чтобы мы могли использовать их для итогового ролика.\n\nА если вы хотите больше узнать о юбилейной конференции PR-Ёлка 2025 - переходите по ссылке:\nhttps://pr.dp.ru/`;

  bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📸 Отправить фото', callback_data: 'send_photo' }],
        [{ text: '🌐 Узнать о конференции', url: 'https://pr.dp.ru/' }]
      ]
    }
  });
});

// Обработчик нажатия на кнопки
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;

  if (data === 'send_photo') {
    // Убираем кнопки из сообщения
    bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      {
        chat_id: chatId,
        message_id: message.message_id
      }
    ).catch(error => {
      console.log('Ошибка при редактировании сообщения:', error);
    });

    // Просим отправить фото
    bot.sendMessage(chatId, 
      '📸 *Отлично! Присылайте ваше фото.*\n\nПросто загрузите изображение в этот чат. Фото будет использоваться для создания юбилейного ролика к 10-летию конференции PR-Ёлка.',
      { parse_mode: 'Markdown' }
    );
  }
});

// Обработчик фотографий
bot.on('photo', (msg) => {
  const photo = msg.photo[msg.photo.length - 1];
  const fileId = photo.file_id;

  // Информация о пользователе (для админа)
   const fullName = `${userName}${userLastName ? ' ' + userLastName : ''}`;

  // Сообщение для администратора
  const adminMessage = `📸 *НОВОЕ ФОТО ДЛЯ PR-ЁЛКИ!*\n\n👤 От: ${fullName}\n📱 Username: ${username}\n⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

  // Отправляем фото администратору
  bot.sendPhoto(ADMIN_CHAT_ID, fileId, {
    caption: adminMessage,
    parse_mode: 'Markdown'
  }).then(() => {
    // Подтверждение пользователю
    bot.sendMessage(chatId,
      '✅ *Фото успешно получено! Спасибо за ваш вклад!*\n\nМожете отправить еще фото или нажать /start для возврата в меню.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📸 Отправить еще фото', callback_data: 'send_photo' }],
            [{ text: '🌐 Сайт конференции', url: 'https://pr.dp.ru/' }]
          ]
        }
      }
    );
  }).catch(error => {
    console.log('Ошибка отправки фото админу:', error);
    bot.sendMessage(chatId, '❌ Произошла ошибка при отправке фото. Попробуйте еще раз.');
  });
});

// Обработчик текстовых сообщений (если пользователь пишет текст вместо фото)
bot.on('message', (msg) => {
  // Игнорируем команды и фото
  if (msg.text && msg.text.startsWith('/')) return;
  if (msg.photo) return;

  const chatId = msg.chat.id;

  bot.sendMessage(chatId,
    `📸 Я жду от вас фотографии для юбилейного ролика PR-Ёлки!\n\nПросто загрузите фото в этот чат или нажмите /start для просмотра основной информации.`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📸 Как отправить фото?', callback_data: 'send_photo' }],
          [{ text: '🌐 Узнать о конференции', url: 'https://pr.dp.ru/' }]
        ]
      }
    }
  );
});

// Веб-сервер для Render
app.use(express.json());
app.get('/', (req, res) => {
  res.send('🎄 PR-Ёлка Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  
  // Запускаем бота
  bot.startPolling().then(() => {
    console.log('✅ Bot started successfully');
  }).catch(error => {
    console.log('❌ Bot error:', error);
  });
});
