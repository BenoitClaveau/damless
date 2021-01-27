class Results {
    constructor(count) {
        this.promise = new Promise((res, rej) => {
            this._resolve = res;
            this.reject = rej;
        })
        this.count = count;
        this.buffer = [];
        
    }
    inc(data) {
        this.buffer.push(data);
        if (this.count !== undefined) {
            this.count--;
            if (this.count < 1)
                this.resolve();
        }
    }
    stop() {
        this._resolve(this.buffer);
    }
}

module.exports = Results;