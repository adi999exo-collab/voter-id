export function setupStatusHandler(io, sessions) {
  const activeConnections = new Map();

  io.on('connection', (socket) => {
    const req = socket.request;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    activeConnections.set(socket.id, ip);

    socket.on('disconnect', () => {
      activeConnections.delete(socket.id);
    });
  });

  function getStatusJson() {
    const activeIps = new Set(activeConnections.values());

    const onlineList = [];
    const offlineList = [];

    for (const [ip, sessionData] of sessions.entries()) {
      const isOnline = activeIps.has(ip);

      const deviceDetail = {
        id: sessionData.id,
        ip: ip,
        status: isOnline ? "online" : "offline"
      };

      if (isOnline) {
        onlineList.push(deviceDetail);
      } else {
        offlineList.push(deviceDetail);
      }
    }

    const jakartaTime = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour12: false
    });

    return {
      status: "success",
      timestamp: jakartaTime,
      summary: {
        total_registered: sessions.size,
        online: onlineList.length,
        offline: offlineList.length
      },
      devices: {
        online_list: onlineList,
        offline_list: offlineList
      }
    };
  }

  return {
    getStatusJson,
    activeConnections
  };
}
