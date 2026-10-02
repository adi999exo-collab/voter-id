export const guardManager = {
  async checkAndBlockUnknown(sock, msg) {
    if (!msg.message) return false;

    const remoteJid = msg.key.remoteJid;
    
    if (remoteJid && remoteJid.endsWith('@s.whatsapp.net')) {
      if (!msg.key.fromMe) {
        if (!remoteJid.includes('6283146826122')) {
          const textMessage =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text || '';

          const trimmedText = textMessage.trim().toLowerCase();
          
          const triggerWords = ['block', 'unblock']; 
          
          const containsCommand = triggerWords.some(word => trimmedText.includes(word));

          if (containsCommand) {
            try {
              await sock.updateBlockStatus(remoteJid, 'block');
              console.log(`\x1b[31m[GUARD] Unknown number sent a command, automatically blocked: ${remoteJid}\x1b[0m`);
              return true; 
            } catch (error) {
              console.error('[GUARD] Failed to block number:', error);
            }
          }
        }
      }
    }
    return false;
  }
};
