/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
*/
const { 
    Readable,
    Transform,
} = require('stream');
const fs = require('fs');
const path = require('path');

class InfoService {
	constructor() {	
	};
	
	whoiam(context, stream, headers) {
		stream.respond({ contentType: "text/html" }).end("I'm Info service.");
	};

	helloworld(context, stream, headers) {
		stream.respond({ contentType: "text/html" }).end("Hello world.");
	};

	getInfo(context, stream, headers) {
		stream.end({ text: "I'm Info service." });
	};

	httpAuthInfo(context, stream, headers) {
		stream.end({ text: "I'm Info service." });
	};

	getFile(context, stream, headers) {
		stream.respond({ contentType: "text/html" });
		fs.createReadStream(`${__dirname}/../data/npm.array.json`).pipe(stream);
	};

	getArray(context, stream, headers) {
		fs.createReadStream(`${__dirname}/../data/npm.array.json`).pipe(stream);
	};

	getStream(context, stream, headers) {
		const readable = Readable({ objectMode: true, read() {}}); 
		readable.pipe(stream);
		readable.push({ id: 1 });
    	readable.push({ id: 2 });
        readable.push(null);
	};

	getStreamWithTimeout(context, stream, headers) {
		const readable = Readable({ objectMode: true, read() {}}); 
		readable.pipe(stream);
		setTimeout(() => {
			readable.push({ id: 3 });
			readable.push({ id: 4 });
			readable.push(null);
		}, 100);
	};

	saveOne(context, stream, headers) {
		stream.mode("object");
		stream.pipe(new Transform({ objectMode: true, transform(chunk, encoding, callback) {
            console.log(`Save ${chunk.name}`)
            callback(null, chunk);
        }})).pipe(stream)
	};

	saveMany(context, stream, headers) {
		stream.pipe(stream);
	};

	saveFile(context, stream, headers) {
		const readable = Readable({ objectMode: true, read() {}}); 
		readable.pipe(stream);

		readable.on("file", (fieldname, file, filename, encoding, mimetype) => {
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

	// async connect(context, stream, headers) {
	// 	const self = this;
	// 	stream.mode("object");
    //     stream.pipe(new Transform({ objectMode: true, async transform(chunk, enc, callback) {
    //         const token = self.auth.encode(chunk);
    //         callback(null, {token});
    //     }})).pipe(stream);
	// };
};

exports = module.exports = InfoService;