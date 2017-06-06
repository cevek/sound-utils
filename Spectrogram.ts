import {FFT} from "./FFT";
export class Spectrogram {
    private data:Uint8ClampedArray[] = [];
    private audioBuffer:AudioBuffer;

    constructor(public fftSize:number) {
    }

    getFFT() {
        return this.data;
    }

    getXByTime(time:number) {
        if (!this.audioBuffer){
            return 0;
        }
        return time / (this.fftSize / this.audioBuffer.sampleRate) | 0;
    }

    getTimeByX(x:number) {
        if (!this.audioBuffer){
            return 0;
        }
        return x * (this.fftSize / this.audioBuffer.sampleRate);
    }

    getImageData() {
        var width = this.data.length;
        var height = this.data[0].length;
        var imd = new ImageData(width, height);
        var imdd = imd.data;
        for (var i = 0; i < width; i++) {
            var item = this.data[i];
            for (var j = 0; j < item.length; j++) {
                var val = item[j];
                var pos = ((height - j) * width + i) * 4;
                imdd[pos + 0] = val;
                imdd[pos + 1] = val;
                imdd[pos + 2] = val;
                imdd[pos + 3] = 255;
            }
        }
        return imd;
    }

    process(audioBuffer:AudioBuffer) {
        this.data = [];
        this.audioBuffer = audioBuffer;
        var bufferSize = this.fftSize;
        var fft = new FFT(bufferSize, 0);
        var signal:Float32Array = this.audioBuffer.getChannelData(0);
        var bufferSignal = new Float32Array(bufferSize);
        var k = 0;
        while (signal.length > k + bufferSize) {
            bufferSignal.set(signal.subarray(k, k + bufferSize));
            k += bufferSize;
            fft.forward(bufferSignal);
            var spectrum = fft.spectrum;
            var arr = new Uint8ClampedArray(spectrum.length);
            for (var j = 0; j < spectrum.length; j++) {
                // equalize, attenuates low freqs and boosts highs
                //arr[j] = spectrum[j] * -1 * Math.log((bufferSize / 2 - j) * (0.5 / bufferSize / 2)) * bufferSize | 0;
                arr[j] = spectrum[j] * 12000;
            }
            this.data.push(arr);
        }
    }
}