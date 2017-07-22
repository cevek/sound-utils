export declare class SoundLoader {
    private audioContext;
    constructor(audioContext: AudioContext);
    parseAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer>;
    fromFileInput(inputFile: HTMLInputElement): Promise<AudioBuffer>;
    fromUrl(url: string): Promise<AudioBuffer>;
}
