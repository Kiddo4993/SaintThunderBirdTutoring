const { randomBytes } = require('crypto');

function createSessionMeeting({ topic } = {}) {
    const roomId = randomBytes(6).toString('hex').toUpperCase();
    const roomName = `STT-${roomId}`;
    const joinUrl = `https://meet.jit.si/${roomName}#config.lobby.enabled=false&config.prejoinPageEnabled=false`;
    console.log(`✅ Jitsi room created: ${joinUrl}`);
    return Promise.resolve({
        provider: 'jitsi',
        id: roomName,
        password: '',
        joinUrl,
        durationMinutes: 60
    });
}

module.exports = { createSessionMeeting };
