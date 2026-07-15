const dns2 = require('dns2');
const os = require('os');
const dgram = require('dgram');

const { Packet } = dns2;

// Function to get the local IPv4 address
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    let bestIp = '127.0.0.1';
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                if (!name.toLowerCase().includes('veth') && !name.toLowerCase().includes('wsl') && !name.toLowerCase().includes('vmware') && !name.toLowerCase().includes('virtual')) {
                    return iface.address;
                }
                if (bestIp === '127.0.0.1') {
                   bestIp = iface.address;
                }
            }
        }
    }
    return bestIp;
}

const TARGET_DOMAIN = 'noteantigravity.com';

const server = dns2.createServer({
  udp: true,
  handle: (request, send, rinfo) => {
    const response = Packet.createResponseFromRequest(request);
    const [ question ] = request.questions || [];
    
    if (!question) {
        return send(response);
    }
    
    const { name } = question;
    
    // Check if the query is for our target domain (including subdomains)
    if (name.toLowerCase() === TARGET_DOMAIN || name.toLowerCase().endsWith('.' + TARGET_DOMAIN)) {
        const localIp = getLocalIp();
        console.log(`[DNS] ${name} -> ${localIp} (Client: ${rinfo.address})`);
        
        response.answers.push({
            name,
            type: Packet.TYPE.A,
            class: Packet.CLASS.IN,
            ttl: 60,
            address: localIp
        });
        
        send(response);
    } else {
        // Proxy to Google DNS for all other requests
        const proxySocket = dgram.createSocket('udp4');
        const rawRequest = request.toBuffer();
        
        proxySocket.send(rawRequest, 53, '8.8.8.8', (err) => {
            if (err) {
                console.error('[DNS Proxy Error]', err);
                proxySocket.close();
                return;
            }
        });
        
        proxySocket.on('message', (msg) => {
            send(msg);
            proxySocket.close();
        });
        
        proxySocket.on('error', (err) => {
            console.error('[DNS Proxy Error]', err);
            proxySocket.close();
        });
        
        // Timeout
        setTimeout(() => {
           try { proxySocket.close(); } catch(e){}
        }, 5000);
    }
  }
});

server.on('request', (request, response, rinfo) => {
    // handled in handle
});

server.on('requestError', (error) => {
  console.log('Client Connection Error', error);
});

server.on('listening', () => {
  const localIp = getLocalIp();
  console.log('==============================================');
  console.log(`🚀 NoteGravity DNS Server is running!`);
  console.log(`👉 UDP Server listening on 0.0.0.0:53`);
  console.log(`🌐 Local IP auto-detected: ${localIp}`);
  console.log(`✨ noteantigravity.com is now bound to ${localIp}`);
  console.log(`📱 Please change your phone's Wi-Fi DNS to: ${localIp}`);
  console.log('==============================================');
});

server.on('close', () => {
  console.log('DNS Server closed');
});

server.listen({
  udp: { 
    port: 53,
    address: '0.0.0.0',
    type: 'udp4'
  }
});
