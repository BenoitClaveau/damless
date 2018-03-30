
# Life cycle

## readable.pipe(transform).pipe(writable)

> Readable

1. pipe(dest, pipeOpts)
1. on("data", fn) 
1. resume()
1. flow() //while state.flowing && stream.read() !== null
1. read(n) 
1. emit("data", chunk)

> Transform

1. on("data", chunk)    //src is readeable
1. write(chunk)
1. writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) //not buffered
1. doWrite(chunk, encoding, state.onwrite)
1. _write(chunk, encoding, callback) //set transformState
1. _read(rs.highWaterMark)
1. _transform(chunk, encoding, callback)

1. > push(chunk)  //needTransform == false
1. Readable.push(chunk)
1. Readable.readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
1. Readable.addChunk(stream, state, chunk, false); //not buffered
1. Readable.emit("data", chunk) -> Writable.write
1. Readable.read(0)
1. Readable._read(0)
1. _read() //no transformState -> nothing todo

1. > callback()
1. afterTransform()         //clear transformState
1. _read(rs.highWaterMark)  //no transformState -> nothing todo

> Writable

. on("data", chunk)    //src is readeable
1. write(chunk)
1. writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) //not buffered
1. doWrite(chunk, encoding, state.onwrite)
1. _write(chunk, encoding, callback)
1. > write(chunk, encoding, callback)

1. > callback()
1. onwrite(stream, er) //clear state
1. afterWrite(stream, state, finished, cb)
1. * if state is empty:  emit("drain")

1. finishMaybe
1. stream.emit('finish');

//fromList shift buffer 




