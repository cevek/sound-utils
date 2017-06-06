const TWO_PI = 2 * Math.PI;

/**
 * FFT is a class for calculating the Discrete Fourier Transform of a signal
 * with the Fast Fourier Transform algorithm.
 *
 * @param {Number} bufferSize The size of the sample buffer to be computed. Must be power of 2
 * @param {Number} sampleRate The sampleRate of the buffer (eg. 44100)
 *
 * @constructor
 */

export class FFT {
    reverseTable:Uint32Array;
    sinTable:Float32Array;
    cosTable:Float32Array;
    sampleRate:number;
    bufferSize:number;
    bandwidth:number;
    peakBand:number;
    peak:number;
    real:Float32Array;
    imag:Float32Array;
    spectrum:Float32Array;

    constructor(bufferSize:number, sampleRate:number) {
        this.fourierTransform(bufferSize, sampleRate);

        this.reverseTable = new Uint32Array(bufferSize);

        var limit = 1;
        var bit = bufferSize >> 1;

        while (limit < bufferSize) {
            for (var i = 0; i < limit; i++) {
                this.reverseTable[i + limit] = this.reverseTable[i] + bit;
            }

            limit = limit << 1;
            bit = bit >> 1;
        }

        this.sinTable = new Float32Array(bufferSize);
        this.cosTable = new Float32Array(bufferSize);

        for (i = 0; i < bufferSize; i++) {
            this.sinTable[i] = Math.sin(-Math.PI / i);
            this.cosTable[i] = Math.cos(-Math.PI / i);
        }
    }

    private fourierTransform(bufferSize:number, sampleRate:number) {
        this.bufferSize = bufferSize;
        this.sampleRate = sampleRate;
        this.bandwidth = 2 / bufferSize * sampleRate / 2;

        this.spectrum = new Float32Array(bufferSize / 2);
        this.real = new Float32Array(bufferSize);
        this.imag = new Float32Array(bufferSize);

        this.peakBand = 0;
        this.peak = 0;

    }

    /**
     * Calculates the *middle* frequency of an FFT band.
     *
     * @param {Number} index The index of the FFT band.
     *
     * @returns The middle frequency in Hz.
     */
    private getBandFrequency(index:number) {
        return this.bandwidth * index + this.bandwidth / 2;
    };

    private calculateSpectrum() {
        var spectrum = this.spectrum,
            real     = this.real,
            imag     = this.imag,
            bSi      = 2 / this.bufferSize,
            sqrt     = Math.sqrt;

        for (var i = 0, N = this.bufferSize / 2; i < N; i++) {
            var rval = real[i];
            var ival = imag[i];
            var mag = bSi * sqrt(rval * rval + ival * ival);

            if (mag > this.peak) {
                this.peakBand = i;
                this.peak = mag;
            }

            spectrum[i] = mag;
        }
    };

    /**
     * Performs a forward transform on the sample buffer.
     * Converts a time domain signal to frequency domain spectra.
     *
     * @param {Array} buffer The sample buffer. Buffer Length must be power of 2
     *
     * @returns The frequency spectrum array
     */
    public forward(buffer:Float32Array) {
        // Locally scope variables for speed up
        var bufferSize   = this.bufferSize,
            cosTable     = this.cosTable,
            sinTable     = this.sinTable,
            reverseTable = this.reverseTable,
            real         = this.real,
            imag         = this.imag,
            spectrum     = this.spectrum;

        var k = Math.floor(Math.log(bufferSize) / Math.LN2);

        if (Math.pow(2, k) !== bufferSize) { throw "Invalid buffer size, must be a power of 2."; }
        if (bufferSize !== buffer.length) { throw "Supplied buffer is not the same size as defined FFT. FFT Size: " + bufferSize + " Buffer Size: " + buffer.length; }

        var halfSize = 1;

        for (i = 0; i < bufferSize; i++) {
            real[i] = buffer[reverseTable[i]];
            imag[i] = 0;
        }

        while (halfSize < bufferSize) {
            //phaseShiftStepReal = Math.cos(-Math.PI/halfSize);
            //phaseShiftStepImag = Math.sin(-Math.PI/halfSize);
            var phaseShiftStepReal = cosTable[halfSize];
            var phaseShiftStepImag = sinTable[halfSize];

            var currentPhaseShiftReal = 1;
            var currentPhaseShiftImag = 0;

            for (var fftStep = 0; fftStep < halfSize; fftStep++) {
                var i = fftStep;

                while (i < bufferSize) {
                    var off = i + halfSize;
                    var tr = (currentPhaseShiftReal * real[off]) - (currentPhaseShiftImag * imag[off]);
                    var ti = (currentPhaseShiftReal * imag[off]) + (currentPhaseShiftImag * real[off]);

                    real[off] = real[i] - tr;
                    imag[off] = imag[i] - ti;
                    real[i] += tr;
                    imag[i] += ti;

                    i += halfSize << 1;
                }

                var tmpReal = currentPhaseShiftReal;
                currentPhaseShiftReal = (tmpReal * phaseShiftStepReal) - (currentPhaseShiftImag * phaseShiftStepImag);
                currentPhaseShiftImag = (tmpReal * phaseShiftStepImag) + (currentPhaseShiftImag * phaseShiftStepReal);
            }

            halfSize = halfSize << 1;
        }

        return this.calculateSpectrum();
    };

}

/**
 * RFFT is a class for calculating the Discrete Fourier Transform of a signal
 * with the Fast Fourier Transform algorithm.
 *
 * This method currently only contains a forward transform but is highly optimized.
 *
 * @param {Number} bufferSize The size of the sample buffer to be computed. Must be power of 2
 * @param {Number} sampleRate The sampleRate of the buffer (eg. 44100)
 *
 * @constructor
 */

// Window functions
enum WindowType{
    BARTLETT     = 1,
    BARTLETTHANN = 2,
    BLACKMAN     = 3,
    COSINE       = 4,
    GAUSS        = 5,
    HAMMING      = 6,
    HANN         = 7,
    LANCZOS      = 8,
    RECTANGULAR  = 9,
    TRIANGULAR   = 10
}

class WindowFunction {
    alpha:number;
    func:(length:number, index:number, alpha?:number)=>number;

    constructor(type:number, alpha:number) {
        this.alpha = alpha;

        switch (type) {
            case WindowType.BARTLETT:
                this.func = WindowFunction.Bartlett;
                break;

            case WindowType.BARTLETTHANN:
                this.func = WindowFunction.BartlettHann;
                break;

            case WindowType.BLACKMAN:
                this.func = WindowFunction.Blackman;
                this.alpha = this.alpha || 0.16;
                break;

            case WindowType.COSINE:
                this.func = WindowFunction.Cosine;
                break;

            case WindowType.GAUSS:
                this.func = WindowFunction.Gauss;
                this.alpha = this.alpha || 0.25;
                break;

            case WindowType.HAMMING:
                this.func = WindowFunction.Hamming;
                break;

            case WindowType.HANN:
                this.func = WindowFunction.Hann;
                break;

            case WindowType.LANCZOS:
                this.func = WindowFunction.Lanczos;
                break;

            case WindowType.RECTANGULAR:
                this.func = WindowFunction.Rectangular;
                break;

            case WindowType.TRIANGULAR:
                this.func = WindowFunction.Triangular;
                break;
        }
    }

    process(buffer:number[]) {
        var length = buffer.length;
        for (var i = 0; i < length; i++) {
            buffer[i] *= this.func(length, i, this.alpha);
        }
        return buffer;
    }

    static Bartlett(length:number, index:number) {
        return 2 / (length - 1) * ((length - 1) / 2 - Math.abs(index - (length - 1) / 2));
    };

    static BartlettHann(length:number, index:number) {
        return 0.62 - 0.48 * Math.abs(index / (length - 1) - 0.5) - 0.38 * Math.cos(TWO_PI * index / (length - 1));
    };

    static Blackman(length:number, index:number, alpha:number) {
        var a0 = (1 - alpha) / 2;
        var a1 = 0.5;
        var a2 = alpha / 2;

        return a0 - a1 * Math.cos(TWO_PI * index / (length - 1)) + a2 * Math.cos(4 * Math.PI * index / (length - 1));
    };

    static Cosine(length:number, index:number) {
        return Math.cos(Math.PI * index / (length - 1) - Math.PI / 2);
    };

    static Gauss(length:number, index:number, alpha:number) {
        return Math.pow(Math.E, -0.5 * Math.pow((index - (length - 1) / 2) / (alpha * (length - 1) / 2), 2));
    };

    static Hamming(length:number, index:number) {
        return 0.54 - 0.46 * Math.cos(TWO_PI * index / (length - 1));
    };

    static Hann(length:number, index:number) {
        return 0.5 * (1 - Math.cos(TWO_PI * index / (length - 1)));
    };

    static Lanczos(length:number, index:number) {
        var x = 2 * index / (length - 1) - 1;
        return Math.sin(Math.PI * x) / (Math.PI * x);
    };

    static Rectangular(length:number, index:number) {
        return 1;
    };

    static Triangular(length:number, index:number) {
        return 2 / length * (length / 2 - Math.abs(index - (length - 1) / 2));
    };
}

