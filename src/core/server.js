import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProvinceFromCoordinates } from '../utils/province.js';
import { startWhatsAppBot } from '../../bots/bot.js';
import { blockManager } from '../sessions/guard.js';
import { setupStatusHandler } from '../handlers/heartbeat.js';
import { setupWebRoutes } from '../web.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

const publicPath = path.join(__dirname, '../../public/html');
const srcPath = path.join(__dirname, '../');

export const sessions = new Map();
const counters = {};

const statusHandler = setupStatusHandler(io, sessions);

app.get('/api/status-stats', (req, res) => {
const nonameParam = req.query.noname;
  if (nonameParam !== '4040') {
    return res.status(403).sendFile(path.join(publicPath, 'token.html'));
  }
  const dataJson = statusHandler.getStatusJson();
  res.json(dataJson);
});

const blacklistedIPs = new Set();

app.get('/api/blacklisted-ips', (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.json({
    ips: Array.from(blacklistedIPs),
    clientIp: clientIp
  });
});

app.get('/api/active-sessions', (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.json({
    clientIp: clientIp,
    sessions: Array.from(sessions.keys())
  });
});

app.get('/403.png', (req, res) => {
  res.sendFile(path.join(publicPath, '403.png'));
});

app.get('/:ip/403.png', (req, res) => {
  res.sendFile(path.join(publicPath, '403.png'));
});

app.get('/999.png', (req, res) => {
  res.sendFile(path.join(publicPath, '999.png'));
});

app.get('/:ip/999.png', (req, res) => {
  res.sendFile(path.join(publicPath, '999.png'));
});

app.get('/:ip', (req, res, next) => {
  const ipParam = req.params.ip;
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;

  if (!ipRegex.test(ipParam)) {
    return next();
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  if (blacklistedIPs.has(clientIp)) {
    return res.status(403).sendFile(path.join(publicPath, 'daftarhitam.html'));
  }

  if (!sessions.has(clientIp)) {
    return res.status(403).sendFile(path.join(publicPath, 'login.html'));
  }
  
  if (req.path.startsWith('/block') || req.path.startsWith('/unblock')) {
    return next();
  }

  if (ipRegex.test(ipParam)) {
    if (!sessions.has(ipParam)) {
      return res.status(200).sendFile(path.join(publicPath, 'ip.html'));
    }

    blacklistedIPs.add(ipParam);
    return res.status(403).sendFile(path.join(publicPath, 'daftarhitam.html'));
  }

  next();
});

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (blacklistedIPs.has(ip)) {
    return res.status(403).sendFile(path.join(publicPath, 'daftarhitam.html'));
  }
  next();
});

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  if (sessions.has(ip)) {
    const sessionData = sessions.get(ip);
    if (sessionData && blockManager.isBlocked(sessionData.id)) {
      return res.status(403).sendFile(path.join(publicPath, 'access-denied.html'));
    }
  }

  if (req.path.startsWith('/block/')) {
    const targetId = req.path.split('/block/')[1];
    const isIdExists = Array.from(sessions.values()).some(s => s.id === targetId) || blockManager.isBlocked(targetId);
    
    if (targetId && !isIdExists) {
      return res.status(404).sendFile(path.join(publicPath, 'block-notfound.html'));
    }
    
    return next();
  }

  if (req.path.startsWith('/unblock/')) {
    const targetId = req.path.split('/unblock/')[1];
    
    if (targetId && !blockManager.isBlocked(targetId)) {
      return res.status(404).sendFile(path.join(publicPath, 'unblock-notfound.html'));
    }

    return next();
  }

  if (req.path.startsWith('/block') || req.path.startsWith('/unblock')) {
    return next();
  }

  if (sessions.has(ip)) {
    const sessionData = sessions.get(ip);
    if (blockManager.isBlocked(sessionData.id)) {
      return res.status(403).sendFile(path.join(publicPath, 'access-denied.html'));
    }
  }
  next();
});

app.use(express.static(publicPath));
app.use('/src', express.static(srcPath));
app.use('/utils', express.static(path.join(__dirname, '../utils')));

setupWebRoutes(app, publicPath, sessions, io);
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicPath, '404.html'));
});

io.on('connection', (socket) => {
  const req = socket.request;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (sessions.has(ip)) {
    const sessionData = sessions.get(ip);
    socket.emit('assign_id', sessionData.id);
  }

  socket.on('send_coordinates', async (data) => {
    let sessionData;
    if (sessions.has(ip)) {
      sessionData = sessions.get(ip);
    } else {
      let provinceName = 'Indonesia';
      let provinceCode = 'INDO';
      
      if (data && data.latitude && data.longitude) {
        const provinceResult = await getProvinceFromCoordinates(data.latitude, data.longitude);
        provinceName = provinceResult.name;
        provinceCode = provinceResult.code;
      }

      if (!counters[provinceCode]) {
        counters[provinceCode] = 0;
      }
      counters[provinceCode] += 1;

      sessionData = {
        id: `${provinceCode}-${counters[provinceCode]}`,
        location: `Lat: ${data.latitude}, Lon: ${data.longitude}`
      };
      sessions.set(ip, sessionData);

      console.log(`IP: ${ip} | Province ${provinceName} | Device ID : ${sessionData.id}`);
    }

    socket.emit('assign_id', sessionData.id);
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 7000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\nServer running at\n   └── http://localhost:${PORT}/\n`);

startWhatsAppBot(io).catch(err => console.error('ERR:', err));
});
