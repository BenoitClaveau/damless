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
            return { input, output: input };
        }
        /**
         * je ne propage pas l'erreur car géré 
         * finised (dans setup)
         * */
        const output = pipeline(...streams, err => { });
        return { input, output };
    }

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

        finished(this.outputStream, err => {
            if (err) {
                // Je propage l'erreur pour ne pas bloquer this
                this.emit("error", err);
            }
        });

        this.outputStream
            .on('data', dataListener)
            .once('end', endListener)

    };

    /**
     * Inutile car la lecture est assurée par la pipeline créé dans getWorkflowStreams
     */
    _read() {

    }

    write(chunk) {
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