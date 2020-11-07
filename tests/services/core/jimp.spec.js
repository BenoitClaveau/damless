/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
const Jimp = require("../../../lib/services/core/jimp");
const fs = require("fs");
const expect = require("expect.js");

describe("jimp", () => {

    it("read & write", async () => {
        let input = `${__dirname}/../../data/world.png`;
        let output = `${__dirname}/../../data/output/world.png`;
        if(fs.existsSync(output)) fs.unlinkSync(output);
        fs.readFileSync(input);
        const image = await Jimp.read(input);
        const buffer = await image.getBufferAsync("image/png");
        fs.writeFileSync(output, buffer);
        expect(fs.existsSync(output)).to.be(true);
    });
    
    it("size", async () => {
        let input = `${__dirname}/../../data/world.png`;
        const image = await Jimp.read(input);
        const size = image.size(image);
        expect(size.width).to.be(800);
        expect(size.height).to.be(550);
    });
    
    it("clone", async () => {
        let input = `${__dirname}/../../data/world.png`;
        const image = await Jimp.read(input);
        const size = image.size(image);
        const clone = image.clone();
        const cloneSize = image.size(clone);
        expect(size.width).to.be(cloneSize.width);
        expect(size.height).to.be(cloneSize.height);
    });
    
    it("crop", async () => {
        let input = `${__dirname}/../../data/world.png`;
        const image = await Jimp.read(input);
        const size = image.size(image);
        expect(size.width).to.be(800);
        expect(size.height).to.be(550);
        const croppedImage = await image.crop(0, 0, 400, 400);
        const croppedSize = image.size(croppedImage);
        expect(croppedSize.width).to.be(400);
        expect(croppedSize.height).to.be(400);
    });
    
    it("resize", async () => {
        let input = `${__dirname}/../../data/world.png`;
        const image = await Jimp.read(input);
        const size = image.size(image);
        expect(size.width).to.be(800);
        expect(size.height).to.be(550);
        const resizedImage = await image.resize(400, 225);
        const resizedSize = image.size(resizedImage);
        expect(resizedSize.width).to.be(400);
        expect(resizedSize.height).to.be(225);
    });
    
    it("cropAndResize same ratio", async () => {
        let input = `${__dirname}/../../data/world.png`;
        let buffer = fs.readFileSync(input);
        const image = await Jimp.read(input);
        const size = image.size(image);
        expect(size.width).to.be(800);
        expect(size.height).to.be(550);
        const resizedImage = await image.cropAndResize(400, 225);
        const resizedSize = image.size(resizedImage);
        expect(resizedSize.width).to.be(400);
        expect(resizedSize.height).to.be(225);
    });
    
    it("cropAndResize great ratio", async () => {
        let input = `${__dirname}/../../data/world.png`;
        let buffer = fs.readFileSync(input);
        const image = await Jimp.read(input);
        const size = image.size(image);
        expect(size.width).to.be(800);
        expect(size.height).to.be(550);
        const resizedImage = await image.cropAndResize(500, 225);
        const resizedSize = image.size(resizedImage);
        expect(resizedSize.width).to.be(500);
        expect(resizedSize.height).to.be(225);
    });
    
    it("cropAndResize less ratio", async () => {
        let input = `${__dirname}/../../data/world.png`;
        let buffer = fs.readFileSync(input);
        const image = await Jimp.read(input);
        const size = image.size(image);
        expect(size.width).to.be(800);
        expect(size.height).to.be(550);
        const resizedImage = await image.cropAndResize(400, 300);
        const resizedSize = image.size(resizedImage);
        expect(resizedSize.width).to.be(400);
        expect(resizedSize.height).to.be(300);
    });
    
    it("scale", async () => {
        let input = `${__dirname}/../../data/world.png`;
        let buffer = fs.readFileSync(input);
        const image = await Jimp.read(input);
        const size = image.size(image);
        expect(size.width).to.be(800);
        expect(size.height).to.be(550);
        const scaledImage = await image.scale(0.5);
        const scaledSize = image.size(scaledImage);
        expect(scaledSize.width).to.be(400);
        expect(scaledSize.height).to.be(275);
    });

    it("lightness", async () => {
        let input = `${__dirname}/../../data/world.png`;
        let buffer = fs.readFileSync(input);
        const image = await Jimp.read(input);
        const lightness = await image.lightness();
        expect(lightness).to.be(1);
    });
    
    it("lightness", async () => {
        let input = `${__dirname}/../../data/world.dark.png`;
        let buffer = fs.readFileSync(input);
        const image = await Jimp.read(input);
        const lightness = await image.lightness();
        expect(lightness).to.be(0.75);
    });
    
    it("greyscale", async () => {
        let input = `${__dirname}/../../data/world.png`;
        let output = `${__dirname}/../../data/output/world.greyscale.png`;
        if(fs.existsSync(output)) return fs.unlinkSync(output);
        let buffer = fs.readFileSync(input);
        const image = await Jimp.read(input);
        const greyImage = await image.greyscale();
        const greyBuffer = await image.getBufferAsync("image/png");
        fs.writeFileSync(output, buffer);
        expect(fs.existsSync(output)).to.be(true);
    });
    
    it("contrast", async () => {
        let input = `${__dirname}/../../data/world.png`;
        let output = `${__dirname}/../../data/output/world.contrast.png`;
        if(fs.existsSync(output)) return fs.unlinkSync(output);
        let buffer = fs.readFileSync(input);
        const image = await Jimp.read(input);
        const greyImage = await image.contrast(0.75);
        const greyBuffer = await image.getBufferAsync("image/png");
        fs.writeFileSync(output, buffer);
        expect(fs.existsSync(output)).to.be(true);
    });
    
    it("blur", async () => {
        let input = `${__dirname}/../../data/world.png`;
        let output = `${__dirname}/../../data/output/world.blur.png`;
        if(fs.existsSync(output)) return fs.unlinkSync(output);
        let buffer = fs.readFileSync(input);
        const image = await Jimp.read(input);
        const greyImage = await image.blur(25);
        const greyBuffer = await image.getBufferAsync("image/png");
        fs.writeFileSync(output, buffer);
        expect(fs.existsSync(output)).to.be(true);
    });
    
    it("opacity", async () => {
        let input = `${__dirname}/../../data/world.png`;
        let output = `${__dirname}/../../data/output/world.opacity.png`;
        if(fs.existsSync(output)) return fs.unlinkSync(output);
        let buffer = fs.readFileSync(input);
        const image = await Jimp.read(input);
        const greyImage = await image.opacity(0.5);
        const greyBuffer = await image.getBufferAsync("image/png");
        fs.writeFileSync(output, buffer);
        expect(fs.existsSync(output)).to.be(true);
    });
    
    it("smartResize crop", async () => {
        let input = `${__dirname}/../../data/world.png`;
        let output = `${__dirname}/../../data/output/world.smartresize.crop.png`;
        if(fs.existsSync(output)) return fs.unlinkSync(output);
        let buffer = fs.readFileSync(input);
        const image = await Jimp.read(input);
        const greyImage = await image.smartResize(400, 200);
        const greyBuffer = await image.getBufferAsync("image/png");
        fs.writeFileSync(output, buffer);
        expect(fs.existsSync(output)).to.be(true);
    });
    
    it("smartResize extend", async () => {
        let input = `${__dirname}/../../data/world.png`;
        let output = `${__dirname}/../../data/output/world.smartresize.extend.png`;
        if(fs.existsSync(output)) return fs.unlinkSync(output);
        let buffer = fs.readFileSync(input);
        const image = await Jimp.read(input);
        const greyImage = await image.smartResize(1600, 800);
        const greyBuffer = await image.getBufferAsync("image/png");
        fs.writeFileSync(output, buffer);
        expect(fs.existsSync(output)).to.be(true);
    });
});