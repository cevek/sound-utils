export declare class Spectrogram {
    fftSize: number;
    private data;
    private audioBuffer;
    constructor(fftSize: number);
    getFFT(): Uint8ClampedArray[];
    getXByTime(time: number): number;
    getTimeByX(x: number): number;
    getImageData(): ImageData;
    process(audioBuffer: AudioBuffer): void;
}
