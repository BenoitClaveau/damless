/*!
 * dambreaker
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
*/
const { 
	Readable, 
	Writable, 
	Transform 
} = require('stream');
const fs = require('fs');
const path = require('path');
const pump = require('pump');

class InfoService {
	constructor(auth) {	
		this.auth = auth;
	};
	
	whoiam(context, stream, headers) {
		stream.contentType("text/html");
		stream.end("I'm Info service.");
	};

	helloworld(context, stream, headers) {
		stream.contentType("text/html");
		stream.end("Hello world.");
	};

	getInfo(context, stream, headers) {
		stream.end({ text: "I'm Info service." });
	};

	httpAuthInfo(context, stream, headers) {
		stream.end({ text: "I'm Info service." });
	};

	getFile(context, stream, headers) {
		stream.contentType("text/html");
		fs.createReadStream(`${__dirname}/../data/npm.array.json`).pipe(stream);
	};

	getArray(context, stream, headers) {
		fs.createReadStream(`${__dirname}/../data/npm.array.json`).pipe(stream);
	};

	getStream(context, stream, headers) {
		const stream = Readable({ objectMode: true, read() {}}); 
		stream.pipe(stream);
		stream.push({ id: 1 });
    	stream.push({ id: 2 });
        stream.push(null);
	};

	getStreamWithTimeout(context, stream, headers) {
		const stream = Readable({ objectMode: true, read() {}}); 
		stream.pipe(stream);
		setTimeout(() => {
			stream.push({ id: 3 });
			stream.push({ id: 4 });
			stream.push(null);
		}, 100);
	};

	saveOne(context, stream, headers) {
		stream.mode("object");
		stream.pipe(stream);
	};

	saveMany(context, stream, headers) {
		stream.pipe(stream);
	};

	saveFile(context, stream, headers) {
		const stream = Readable({ objectMode: true, read() {}}); 
		stream.pipe(stream);

		stream.on("file", (fieldname, file, filename, encoding, mimetype) => {
			const filepath = `${__dirname}/../data/output/${filename}`;
			if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

			const output = fs.createWriteStream(filepath);
			file.pipe(output).on("finish", () => {
				stream.push({ filepath: filepath })
				stream.push(null);
			})
		})
	};

	uploadImage(context, stream, headers) {
		stream.mode("buffer");
		stream.on("file", (fieldname, file, filename, encoding, mimetype) => {
			const parsed = path.parse(filename);
			const filepath = `${__dirname}/../data/output/${parsed.name}.server${parsed.ext}`;
			if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
			file.pipe(fs.createWriteStream(filepath)).on("finish", () => {
				fs.createReadStream(filepath).pipe(stream);
			})
		})
	};

	async connect(context, stream, headers) {
		const self = this;
		stream.mode("object");
        stream.pipe(new Transform({ objectMode: true, async transform(chunk, enc, callback) {
            const token = self.auth.encode(chunk);
            callback(null, {token});
        }})).pipe(stream);
	};
};

exports = module.exports = InfoService;