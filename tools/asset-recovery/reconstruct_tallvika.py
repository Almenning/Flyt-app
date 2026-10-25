#!/usr/bin/env python3
"""Recover the exact clean, user-approved Tallvika art via audited Git chunks.

The earlier PR binary upload was corrupt, with a broken zlib stream starting
at byte 393216. These chunks encode the complete approved figure-free source
with its approved TALLVIKA sign. No alternate characters are generated.
"""
import base64
import binascii
import hashlib
import struct
import zlib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
PARTS=ROOT/"tools/asset-recovery/tallvika-20261025"
DEST=ROOT/"laer-litt-mer/assets/tallvika/tallvika-master-laast-20261025.png"
SHA256="eff445ccbc59b143fc587081e50b0f0fadc58e3668e2a15c52b7e41a036865dd"
EXPECTED_PARTS=11

def verify_png(data):
    assert data.startswith(b"\x89PNG\r\n\x1a\n"),"Invalid PNG signature"
    pos=8
    chunks=[]
    image_data=[]
    while pos<len(data):
        assert pos+12<=len(data),"Truncated PNG chunk header"
        length=struct.unpack_from(">I",data,pos)[0]
        ctype=data[pos+4:pos+8]
        end=pos+12+length
        assert end<=len(data),"Truncated PNG chunk data"
        chunk=data[pos+8:pos+8+length]
        crc=struct.unpack_from(">I",data,pos+8+length)[0]
        assert (binascii.crc32(ctype+chunk)&0xffffffff)==crc, "PNG chunk CRC mismatch"
        chunks.append(ctype)
        if ctype==b'IHDR':
            w,h,depth,color,compression,filtering,interlace=struct.unpack(">IIBBBBB",chunk)
            assert (w,h,depth,color,interlace)==(1672,941,8,2,0), "Locked source dimensions changed"
        if ctype==b'IDAT':image_data.append(chunk)
        pos=end
        if ctype==b'IEND':break
    assert pos==len(data) and chunks[-1]==b'IEND',"Missing/trailing IEND"
    raw=zlib.decompress(b''.join(image_data))
    assert len(raw)==941*(1+1672*3),"Incomplete pixel data: do not ship a top strip"
    return len(raw)

def main():
    parts=sorted(PARTS.glob("part-*.b64"))
    assert len(parts)==EXPECTED_PARTS, f"Expected {EXPECTED_PARTS} source parts"
    joined=b''.join(part.read_bytes().strip() for part in parts)
    data=base64.b64decode(joined,validate=True)
    digest=hashlib.sha256(data).hexdigest()
    assert digest==SHA256, f"Source identity mismatch: {digest}"
    pixel_bytes=verify_png(data)
    DEST.parent.mkdir(parents=True,exist_ok=True)
    DEST.write_bytes(data)
    assert verify_png(DEST.read_bytes())==pixel_bytes
    print(f"TALLVIKA_VALID_FULL_IMAGE source-sha256={digest} bytes={len(data)} scanlines=941 decoded={pixel_bytes}")
if __name__=="__main__":main()
