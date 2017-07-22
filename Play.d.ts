export declare const enum PlayingStatus {
    PLAYING = 0,
    STOPPING = 1,
}
export declare class Play {
    audioContext: AudioContext;
    private playSource;
    private startPlayTime;
    private start;
    private dur;
    private audioBuffer;
    private state;
    constructor(audioContext: AudioContext);
    setAudio(audioBuffer: AudioBuffer): void;
    cutAudioBuffer(start: number, end: number): AudioBuffer;
    play(start: number, dur: number, loop?: boolean, onEnded?: () => void): void;
    private onEnded;
    stop(): void;
    getState(): PlayingStatus;
    getCurrentTime(): number;
}
