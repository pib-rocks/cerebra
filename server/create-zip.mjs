import {deflateRawSync} from "zlib";

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[i] = c >>> 0;
    }
    return table;
})();

function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function u16(value) {
    const buf = Buffer.alloc(2);
    buf.writeUInt16LE(value, 0);
    return buf;
}

function u32(value) {
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(value >>> 0, 0);
    return buf;
}

/**
 * Builds a minimal ZIP archive without extra deps.
 * @param {Record<string, string|Buffer>} files
 * @returns {Buffer}
 */
export function createZip(files) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const entries = Object.entries(files);

    for (const [name, content] of entries) {
        const nameBuf = Buffer.from(name, "utf8");
        const data = Buffer.isBuffer(content)
            ? content
            : Buffer.from(content, "utf8");
        const compressed = deflateRawSync(data);
        const checksum = crc32(data);
        const localHeader = Buffer.concat([
            u32(0x04034b50),
            u16(20),
            u16(0),
            u16(8),
            u16(0),
            u16(0),
            u32(checksum),
            u32(compressed.length),
            u32(data.length),
            u16(nameBuf.length),
            u16(0),
            nameBuf,
        ]);
        const localSize = localHeader.length + compressed.length;
        localParts.push(localHeader, compressed);

        const centralHeader = Buffer.concat([
            u32(0x02014b50),
            u16(20),
            u16(20),
            u16(0),
            u16(8),
            u16(0),
            u16(0),
            u32(checksum),
            u32(compressed.length),
            u32(data.length),
            u16(nameBuf.length),
            u16(0),
            u16(0),
            u16(0),
            u16(0),
            u32(0),
            u32(offset),
            nameBuf,
        ]);
        centralParts.push(centralHeader);
        offset += localSize;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const end = Buffer.concat([
        u32(0x06054b50),
        u16(0),
        u16(0),
        u16(entries.length),
        u16(entries.length),
        u32(centralDirectory.length),
        u32(offset),
        u16(0),
    ]);

    return Buffer.concat([...localParts, centralDirectory, end]);
}
