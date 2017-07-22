/**
 * FFT is a class for calculating the Discrete Fourier Transform of a signal
 * with the Fast Fourier Transform algorithm.
 *
 * @param {Number} bufferSize The size of the sample buffer to be computed. Must be power of 2
 * @param {Number} sampleRate The sampleRate of the buffer (eg. 44100)
 *
 * @constructor
 */
export declare class FFT {
    reverseTable: Uint32Array;
    sinTable: Float32Array;
    cosTable: Float32Array;
    sampleRate: number;
    bufferSize: number;
    bandwidth: number;
    peakBand: number;
    peak: number;
    real: Float32Array;
    imag: Float32Array;
    spectrum: Float32Array;
    constructor(bufferSize: number, sampleRate: number);
    private fourierTransform(bufferSize, sampleRate);
    /**
     * Calculates the *middle* frequency of an FFT band.
     *
     * @param {Number} index The index of the FFT band.
     *
     * @returns The middle frequency in Hz.
     */
    private getBandFrequency(index);
    private calculateSpectrum();
    /**
     * Performs a forward transform on the sample buffer.
     * Converts a time domain signal to frequency domain spectra.
     *
     * @param {Array} buffer The sample buffer. Buffer Length must be power of 2
     *
     * @returns The frequency spectrum array
     */
    forward(buffer: Float32Array): void;
}
