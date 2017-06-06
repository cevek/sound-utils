export class SoundLoader {
    constructor(private audioContext:AudioContext) {
    }

    parseAudio(arrayBuffer:ArrayBuffer) {
        return new Promise<AudioBuffer>((resolve, reject) => {
            this.audioContext.decodeAudioData(arrayBuffer, resolve, reject);
        });
    }

    fromFileInput(inputFile:HTMLInputElement) {
        var files = inputFile.files; // FileList object
        var file = files[0];
        var reader = new FileReader();
        reader.readAsArrayBuffer(file);
        return new Promise<AudioBuffer>((resolve, reject) => {
            reader.onload = () => {
                this.parseAudio(reader.result).then(resolve, reject);
            };
        });
    }

    fromUrl(url:string) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.send();
        return new Promise<AudioBuffer>((resolve, reject) => {
            request.onload = () => {
                this.parseAudio(request.response).then(resolve, reject);
            }
        });
    }
}