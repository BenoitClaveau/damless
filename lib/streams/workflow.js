/**
 * https://github.com/nodejs/nodejs.org/blob/master/locale/en/docs/guides/backpressuring-in-streams.md
 */

const {
    Transform,
    pipeline,
    finished,
    PassThrough,
    Duplex
} = require("stream");

class Workflow extends Duplex {

    constructor(arg0, options) {
        super(options);
        this.options = options;
        this._arg0 = arg0;
    }

    // Function*
    get workflowStreams() {
        return this._arg0;
    }

    getWorkflowStreams() {
        let streams = [];
        if (typeof this.workflowStreams == "function") {
            streams = Array.from(this.workflowStreams());
        }
        else {
            streams.push(this.workflowStreams);
        }
        if (!streams.length) {
            // Si aucun flux interne, je créé PassThrough.
            streams.push(new PassThrough(this.options));
        }

        const input = streams[0];
        if (streams.length === 1) {
            finished(input, err => {
                if (err) {
                    // Je propage l'erreur pour ne pas bloquer this
                    this.emit("error", err);
                }
            })
            return { input, output: input };
        }
        /**
         * je ne propage pas l'erreur car géré 
         * finised (dans setup)
         * */
        const output = pipeline(...streams, err => { 
            if (err) {
                // Je propage l'erreur pour ne pas bloquer this
                this.emit("error", err);
            }
        });
        return { input, output };
    }

    /**
     * retourne le prochain chunk.
     * peut être surchargé si readableStream n'est pas standard.
     */
    getNextChunk(n) {
        /**
         * HACK through.js read n'existe pas
         * through.js emit data
         */
        if (!this.outputStream.read) return null;
        return this.outputStream.read(n);
    }

    flow(n) {
        try {
            let chunk;
            while (null !== (chunk = this.getNextChunk(n))) {
                // if push returns false, stop writing
                if (!this.push(chunk)) break;
            }
        }
        catch (error) {
            this.emit("error", error);
        }
    };

    setup() {
        this.handlersSetup = true; // only set handlers up once
        // je ne peux pas uiliser pipe car this est un stream readable (pas de write)
        const dataListener = (chunk) => {
            this.push(chunk);
        }
        const endListener = () => {
            /**
             * push(null) va émettre un évenement end sur this.
             * je l'attend pour cloturer le wrapper.
             */
            this.once("end", () => {
                super.end();
            });
            this.push(null);
        }

        const { input, output } = this.getWorkflowStreams();
        this.inputStream = input;
        this.outputStream = output;
        if (!this.inputStream && !this.outputStream) {
            throw new Error("getWorkflowStreams doesn't return stream.");
        }

        this.outputStream
            .on("data", dataListener)
            .once("end", endListener)
        //IMPORANT ne pas écouter "readable" sinon bloquage. A investiguer!
    };

    _read(n) {
        try {
            // first time, setup handlers then read
            if (!this.handlersSetup) {
                return this.setup(n);
            }
            // otherwise just read
            this.flow(n);
        }
        catch (error) {
            this.emit("error", error);
        }
    };

    /*
    _write(chunk, encoding, callback){
        try {
            if (!this.handlersSetup) {
                this.setup();
            }
            const ok = this.inputStream.write(chunk, encoding, () => {
                ok && callback()
            });
            if(!ok) this.inputStream.once('drain', callback);
        }
        catch (error) {
            this.emit("error", error);
        }
    }
    */

   write(chunk, encoding, callback){
    try {
        if (!this.handlersSetup) {
            this.setup();
        }
        this.inputStream.write(chunk);
    }
    catch (error) {
        this.emit("error", error);
    }
}

    end() {
        try {
            if (!this.handlersSetup) {
                this.setup();
            }
            this.inputStream.end();
            /**
             * Je n'appelle pas encore super.end car il faut attandre la fin
             * du traitement dans le workflow cf outputStream.
             */
        }
        catch (error) {
            this.emit("error", error);
        }
    }


}

module.exports = Workflow;