import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/bin/utils';

// Để y-websocket client hoạt động, server bắt buộc phải dùng native WebSockets (ví dụ gói 'ws')
// thay vì Socket.IO mặc định của NestJS.
// Ở đây ta dùng cổng riêng biệt (ví dụ 1234) chỉ để phục vụ cho y-websocket.
@WebSocketGateway(1234, {
  cors: {
    origin: '*',
  },
  path: '/'
})
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: any; // Đây sẽ là instance của 'ws' Server (cần cấu hình WsAdapter ở main.ts)

  handleConnection(client: any, request: any) {
    console.log('New Yjs client connected');
    // Mặc định tên document có thể lấy từ URL hoặc truyền cứng
    const docName = request?.url?.slice(1)?.split('?')[0] || 'notegravity-doc-1';
    
    // Gọi hàm có sẵn của thư viện y-websocket để xử lý logic đồng bộ (Sync step 1, 2)
    setupWSConnection(client, request, { docName });
  }

  handleDisconnect(client: any) {
    console.log('Yjs client disconnected');
  }
}
