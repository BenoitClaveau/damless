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

    constructor(arg0, options = {}) {
        super(options);
        this.options = options;
        this._arg0 = arg0;
        // Corking the stream automatically allows writes to happen
        // but ensures that those are buffered until the handle has
        // been assigned.
        this.cork();
    }

    // Function*
    get workflowStreams() {
        return this._arg0;
    }

    getWorkflowStreams() {
        let streams = [];
        const fn = this.workflowStreams;
        if (typeof fn == "function") {
            streams = Array.from(fn.call(this));
        }
        else {
            streams.push(fn);
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
                else {
                    super.end();
                }
            });
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
            else {
                super.end();
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

    setup(n) {
        this.handlersSetup = true; // only set handlers up once
        // je ne peux pas uiliser pipe car this est un stream readable (pas de write)
        const dataListener = (chunk) => {
            this.push(chunk);
        }
        const endListener = () => {
            this.push(null);
        }
        const readableListener = () => {
            this.flow(n);
        }
        const drainListener = () => {
            this.emit("drain");
        }

        const { input, output } = this.getWorkflowStreams();
        this.inputStream = input;
        this.outputStream = output;
        if (!this.inputStream && !this.outputStream) {
            throw new Error("getWorkflowStreams doesn't return stream.");
        }

        this.outputStream
            .once('readable', () => {
                /**
                 * L'évenement readable est toujours envoyé avant data
                 * s'il est envoyé pas besoin d'écouter data.
                 * pour les stream ancien ex: througt.js readable n'est pas envoyé
                 * dans ce cas je vais écouter data.
                 */
                this.outputStream.off("data", dataListener);
            })
            .on('readable', readableListener)
            .on('data', dataListener)
            .on('end', endListener)
        
        this.inputStream
            .on("drain", drainListener);
    };

    _read(n) {
        /**
         * Workflow est un flux transform. La lecture est gérée par le pipeline interne.
         * Il faut écrire dans this pour créer le pipeline.
         * */
    };

    write(chunk) {
        try {
            if (!this.handlersSetup) {
                this.setup();
            }
            return this.inputStream.write(chunk);
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
            return this.inputStream.end();
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