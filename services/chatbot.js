import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { sessions } from '../src/core/server.js';
import { blockManager } from '../src/sessions/guard.js';
import { guardManager } from './guard.js';
import pino from 'pino';

let pairingRequested = false;
let isBotInitialized = false;

export async function startWhatsAppBot(io) {
  if (isBotInitialized) return;
  isBotInitialized = true;

  const { state, saveCreds } = await useMultiFileAuthState('sessions');

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'error' }),
    printQRInTerminal: false
  });

  sock.ev.on('creds.update', saveCreds);

  if (!sock.authState.creds.registered && !pairingRequested) {
    pairingRequested = true;
    const phoneNumber = '6283146826122';
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(`Pairing Code: ${code}`);
      } catch (error) {
        pairingRequested = false;
      }
    }, 6000);
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        pairingRequested = false;
        isBotInitialized = false;
        startWhatsAppBot(io);
      }
    } else if (connection === 'open') {
      console.log('\x1b[1m\x1b[32mWhatsApp bot successfully connected and active.\x1b[0m');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message) continue;

      const isBlockedByGuard = await guardManager.checkAndBlockUnknown(sock, msg);
      if (isBlockedByGuard) continue;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid.includes('6283146826122') && !msg.key.fromMe) continue;

      const textMessage =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text || '';

      const trimmedText = textMessage.trim();
      const parts = trimmedText.split(/[\s/]+/);
      const command = parts[0]?.toLowerCase();
      const targetId = parts[1];

      if ((command === 'block' || command === 'unblock') && targetId) {
        const isIdExists = Array.from(sessions.values()).some(s => s.id === targetId) || blockManager.isBlocked(targetId);                    
        if (!isIdExists) {
          await sock.sendMessage(remoteJid, { text: `ID ${targetId} Not Found on server` });
          continue;
        }

        if (command === 'block') {
          blockManager.blockId(targetId);

          if (io) {
            for (let [socketId, socketInstance] of io.sockets.sockets.entries()) {
              const socketIp = socketInstance.handshake.headers['x-forwarded-for'] || socketInstance.conn.remoteAddress;
              const sessionData = sessions.get(socketIp);
              if (sessionData && sessionData.id === targetId) {
                socketInstance.emit('access_blocked', 'Access Blocked by Administrator');
              }
            }
          }

          await sock.sendMessage(remoteJid, { text: `ID ${targetId} successfully blocked` });
        } else if (command === 'unblock') {
          blockManager.unblockId(targetId);

          if (io) {
            for (let [socketId, socketInstance] of io.sockets.sockets.entries()) {
              const socketIp = socketInstance.handshake.headers['x-forwarded-for'] || socketInstance.conn.remoteAddress;
              const sessionData = sessions.get(socketIp);
              if (sessionData && sessionData.id === targetId) {
                socketInstance.emit('access_unblocked', 'Access Restored');
              }
            }
          }

          await sock.sendMessage(remoteJid, { text: `ID ${targetId} successfully unblocked` });
        }
      }
    }
  });

  return sock;
}
