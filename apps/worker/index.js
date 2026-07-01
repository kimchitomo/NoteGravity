const { Worker } = require('bullmq');
const IORedis = require('ioredis');

// Giả lập thư viện OCR (như Tesseract.js)
const mockTesseractRecognize = async (imageUrl) => {
  console.log(`[OCR] Đang phân tích hình ảnh: ${imageUrl}`);
  await new Promise(resolve => setTimeout(resolve, 2000)); // Giả lập tốn 2 giây
  return "Đoạn văn bản trích xuất được từ hình ảnh: 'Báo cáo doanh thu tháng 10 NoteGravity'.";
};

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
});

console.log('Worker đang khởi động và kết nối tới Redis...');

const ocrWorker = new Worker(
  'image-processing',
  async (job) => {
    const { noteId, imageUrl } = job.data;
    console.log(`[Job ${job.id}] Nhận yêu cầu OCR cho Note ${noteId}`);
    
    try {
      // B1: Đọc ảnh qua URL (có thể là URL nội bộ từ MinIO Tailscale)
      const extractedText = await mockTesseractRecognize(imageUrl);
      
      // B2: Cập nhật vào Database (Prisma/Postgres)
      console.log(`[Job ${job.id}] Lưu kết quả vào DB cho Note ${noteId}:\n>> "${extractedText}"`);
      
      // B3: Đánh chỉ mục tìm kiếm (Elasticsearch) - tùy chọn
      
      return { success: true, text: extractedText };
    } catch (error) {
      console.error(`[Job ${job.id}] Lỗi xử lý OCR:`, error);
      throw error;
    }
  },
  { connection }
);

ocrWorker.on('completed', (job, returnvalue) => {
  console.log(`[Job ${job.id}] Hoàn thành thành công!`);
});

ocrWorker.on('failed', (job, err) => {
  console.log(`[Job ${job.id}] Thất bại với lỗi: ${err.message}`);
});
