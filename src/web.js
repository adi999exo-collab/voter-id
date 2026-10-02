import express from 'express';
import path from 'path';
import { blockManager } from './sessions/guard.js';

export function setupWebRoutes(app, publicPath, sessions, io) {
  const boxWidth = 40;
  const topBottomBorder = '─'.repeat(boxWidth + 2);

  const createLine = (text, colorCode) => {
    const cleanLength = text.replace(/\x1b\[[0-9;]*m/g, '').length;
    const padding = Math.max(0, boxWidth - cleanLength);
    return `${colorCode}│ ${text}${' '.repeat(padding)} │\x1b[0m`;
  };

  app.get('/block/:id', (req, res) => {
    const targetId = req.params.id;
    const requesterIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    let requesterId = 'Unknown / Admin';
    for (let [ip, data] of sessions.entries()) {
      if (ip === requesterIp) {
        requesterId = data.id;
        break;
      }
    }

    let idExists = false;
    for (let [ip, data] of sessions.entries()) {
      if (data.id === targetId) {
        idExists = true;
        break;
      }
    }

    if (!idExists) {
      console.log(
        `\n\x1b[1;37m╭${topBottomBorder}╮\x1b[0m\n` +
        createLine('[NOT FOUND] Block Action Failed', '\x1b[1;37m') + '\n' +
        `\x1b[1;37m├${topBottomBorder}┤\x1b[0m\n` +
        createLine('ACTOR (Requester)', '\x1b[1;36m') + '\n' +
        createLine(`  ├─ ID : ${requesterId}`, '\x1b[1;36m') + '\n' +
        createLine(`  └─ IP : ${requesterIp}`, '\x1b[1;36m') + '\n' +
        createLine('TARGET (User)', '\x1b[1;33m') + '\n' +
        createLine(`  └─ ID : ${targetId} (Not Found)`, '\x1b[1;33m') + '\n' +
        `\x1b[1;37m╰${topBottomBorder}╯\x1b[0m`
      );
      return res.sendFile(path.join(publicPath, 'block-notfound.html'));
    }

    if (blockManager.isBlocked(targetId)) {
      console.log(
        `\n\x1b[1;33m╭${topBottomBorder}╮\x1b[0m\n` +
        createLine('[WARNING] Device ID Already Blocked', '\x1b[1;33m') + '\n' +
        `\x1b[1;33m├${topBottomBorder}┤\x1b[0m\n` +
        createLine('ACTOR (Requester)', '\x1b[1;36m') + '\n' +
        createLine(`  ├─ ID : ${requesterId}`, '\x1b[1;36m') + '\n' +
        createLine(`  └─ IP : ${requesterIp}`, '\x1b[1;36m') + '\n' +
        createLine('TARGET (User)', '\x1b[1;33m') + '\n' +
        createLine(`  └─ ID : ${targetId}`, '\x1b[1;33m') + '\n' +
        `\x1b[1;33m╰${topBottomBorder}╯\x1b[0m`
      );
      return res.sendFile(path.join(publicPath, 'block-list.html'));
    }

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

    console.log(
      `\n\x1b[1;31m╭${topBottomBorder}╮\x1b[0m\n` +
      createLine('[BLOCKED] Success Blocking Device ID', '\x1b[1;31m') + '\n' +
      `\x1b[1;31m├${topBottomBorder}┤\x1b[0m\n` +
      createLine('ACTOR (Requester)', '\x1b[1;36m') + '\n' +
      createLine(`  ├─ ID : ${requesterId}`, '\x1b[1;36m') + '\n' +
      createLine(`  └─ IP : ${requesterIp}`, '\x1b[1;36m') + '\n' +
      createLine('TARGET (User)', '\x1b[1;31m') + '\n' +
      createLine(`  └─ ID : ${targetId}`, '\x1b[1;31m') + '\n' +
      `\x1b[1;31m╰${topBottomBorder}╯\x1b[0m`
    );
    res.sendFile(path.join(publicPath, 'block-success.html'));
  });

  app.get('/unblock/:id', (req, res) => {
    const targetId = req.params.id;
    const requesterIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    let requesterId = 'Unknown / Admin';
    for (let [ip, data] of sessions.entries()) {
      if (ip === requesterIp) {
        requesterId = data.id;
        break;
      }
    }

    let idExists = false;
    for (let [ip, data] of sessions.entries()) {
      if (data.id === targetId) {
        idExists = true;
        break;
      }
    }

    if (!idExists) {
      console.log(
        `\n\x1b[1;37m╭${topBottomBorder}╮\x1b[0m\n` +
        createLine('[NOT FOUND] Unblock Action Failed', '\x1b[1;37m') + '\n' +
        `\x1b[1;37m├${topBottomBorder}┤\x1b[0m\n` +
        createLine('ACTOR (Requester)', '\x1b[1;36m') + '\n' +
        createLine(`  ├─ ID : ${requesterId}`, '\x1b[1;36m') + '\n' +
        createLine(`  └─ IP : ${requesterIp}`, '\x1b[1;36m') + '\n' +
        createLine('TARGET (User)', '\x1b[1;33m') + '\n' +
        createLine(`  └─ ID : ${targetId} (Not Found)`, '\x1b[1;33m') + '\n' +
        `\x1b[1;37m╰${topBottomBorder}╯\x1b[0m`
      );
      return res.sendFile(path.join(publicPath, 'unblock-notfound.html'));
    }

    const wasBlocked = blockManager.unblockId(targetId);

    if (wasBlocked) {
      if (io) {
        for (let [socketId, socketInstance] of io.sockets.sockets.entries()) {
          const socketIp = socketInstance.handshake.headers['x-forwarded-for'] || socketInstance.conn.remoteAddress;
          const sessionData = sessions.get(socketIp);
          if (sessionData && sessionData.id === targetId) {
            socketInstance.emit('access_unblocked', 'Access Restored');
          }
        }
      }

      console.log(
        `\n\x1b[1;34m╭${topBottomBorder}╮\x1b[0m\n` +
        createLine('[UNBLOCKED] Success Unblocking Device ID', '\x1b[1;34m') + '\n' +
        `\x1b[1;34m├${topBottomBorder}┤\x1b[0m\n` +
        createLine('ACTOR (Requester)', '\x1b[1;36m') + '\n' +
        createLine(`  ├─ ID : ${requesterId}`, '\x1b[1;36m') + '\n' +
        createLine(`  └─ IP : ${requesterIp}`, '\x1b[1;36m') + '\n' +
        createLine('TARGET (User)', '\x1b[1;34m') + '\n' +
        createLine(`  └─ ID : ${targetId}`, '\x1b[1;34m') + '\n' +
        `\x1b[1;34m╰${topBottomBorder}╯\x1b[0m`
      );
      res.sendFile(path.join(publicPath, 'unblock-success.html'));
    } else {
      console.log(
        `\n\x1b[1;37m╭${topBottomBorder}╮\x1b[0m\n` +
        createLine('[NOT IN LIST] Unblock Failed', '\x1b[1;37m') + '\n' +
        `\x1b[1;37m├${topBottomBorder}┤\x1b[0m\n` +
        createLine('ACTOR (Requester)', '\x1b[1;36m') + '\n' +
        createLine(`  ├─ ID : ${requesterId}`, '\x1b[1;36m') + '\n' +
        createLine(`  └─ IP : ${requesterIp}`, '\x1b[1;36m') + '\n' +
        createLine('TARGET (User)', '\x1b[1;37m') + '\n' +
        createLine(`  └─ ID : ${targetId}`, '\x1b[1;37m') + '\n' +
        `\x1b[1;37m╰${topBottomBorder}╯\x1b[0m`
      );
      res.sendFile(path.join(publicPath, 'unblock-notfound.html'));
    }
  });
}
