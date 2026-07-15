import { pipeline, env } from '@huggingface/transformers';

// Configure environment
env.allowLocalModels = false;
env.useBrowserCache = true;

const originalWarn = console.warn;
console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Failed to cache')) return;
    originalWarn(...args);
};

let synthesizer: any = null;
let isInitializing = false;

self.onmessage = async (event: MessageEvent) => {
    const { type, text, id, nodeId } = event.data;

    if (type === 'INIT') {
        if (!synthesizer && !isInitializing) {
            isInitializing = true;
            self.postMessage({ status: 'loading' });
            try {
                synthesizer = await pipeline('text-to-speech', 'Xenova/mms-tts-vie', {
                    device: 'wasm' as any,
                    progress_callback: (x: any) => {
                        self.postMessage({ status: 'progress', data: x });
                    }
                });
                self.postMessage({ status: 'loaded' });
            } catch (error: any) {
                self.postMessage({ status: 'error', error: error.message || error.toString() });
            } finally {
                isInitializing = false;
            }
        }
        return;
    }

    if (type === 'GENERATE') {
        if (!synthesizer) {
            // Wait for initialization or trigger it
            if (!isInitializing) {
                 isInitializing = true;
                 self.postMessage({ status: 'loading' });
                 try {
                     synthesizer = await pipeline('text-to-speech', 'Xenova/mms-tts-vie', {
                         device: 'wasm' as any,
                         progress_callback: (x: any) => {
                             self.postMessage({ status: 'progress', data: x });
                         }
                     });
                     self.postMessage({ status: 'loaded' });
                 } catch (error: any) {
                     self.postMessage({ status: 'error', error: error.message || error.toString() });
                     isInitializing = false;
                     return;
                 }
                 isInitializing = false;
            } else {
                 while (isInitializing) {
                     await new Promise(resolve => setTimeout(resolve, 100));
                 }
            }
            if (!synthesizer) {
                 self.postMessage({ status: 'error', error: 'Failed to initialize synthesizer', id });
                 return;
            }
        }

        try {
            self.postMessage({ status: 'generating', id });
            const out = await synthesizer(text);
            self.postMessage({
                status: 'complete',
                audio: out.audio,
                sampling_rate: out.sampling_rate,
                text,
                id,
                nodeId
            });
        } catch (error: any) {
            self.postMessage({ status: 'error', error: error.message || error.toString(), id });
        }
    }
};
