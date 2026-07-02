import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber: any = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

self.onmessage = async (event: MessageEvent) => {
    const { type, audio, id, device } = event.data;

    if (type === 'INIT') {
        if (!transcriber && !isInitializing) {
            isInitializing = true;
            self.postMessage({ status: 'loading' });
            
            initPromise = (async () => {
                try {
                    const loadPipeline = async (dev: string) => {
                        const modelName = dev === 'webgpu' 
                            ? 'onnx-community/whisper-base' 
                            : 'onnx-community/whisper-tiny';

                        return await pipeline('automatic-speech-recognition', modelName, {
                            device: dev as any,
                            dtype: {
                                encoder_model: 'fp32',
                                decoder_model_merged: 'fp32', // Bypass all q4 quantization bugs
                            } as any,
                            progress_callback: (x: any) => {
                                self.postMessage({ status: 'progress', data: x });
                            }
                        });
                    };

                    try {
                        transcriber = await loadPipeline(device);
                    } catch (err: any) {
                        const errMsg = err.message || err.toString();
                        if (device === 'webgpu' && errMsg.includes('GPU adapter')) {
                            self.postMessage({ status: 'error', error: 'Trình duyệt chưa bật WebGPU (hoặc không hỗ trợ). Đang tự động tải bằng CPU...' });
                            transcriber = await loadPipeline('wasm');
                        } else {
                            throw err;
                        }
                    }

                    self.postMessage({ status: 'loaded' });
                } catch (error: any) {
                    self.postMessage({ status: 'error', error: error.message || error.toString() });
                    throw error;
                } finally {
                    isInitializing = false;
                }
            })();
        }
        return;
    }

    if (type === 'TRANSCRIBE') {
        try {
            self.postMessage({ status: 'transcribing', id });
            
            if (!transcriber) {
                if (initPromise) {
                    await initPromise;
                } else {
                    throw new Error("Transcriber not initialized and no init in progress");
                }
            }

            const result = await transcriber(audio, {
                language: 'vietnamese',
                task: 'transcribe'
            });
            
            self.postMessage({
                status: 'complete',
                text: result.text,
                id
            });
        } catch (error: any) {
            self.postMessage({ status: 'error', error: error.message || error.toString(), id });
        }
    }
};
