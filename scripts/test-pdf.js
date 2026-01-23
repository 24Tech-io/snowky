const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const pdfDefault = require('pdf-parse').default;

console.log('Type of pdf:', typeof pdf);
console.log('Type of pdf.default:', typeof pdfDefault);

try {
    const pdfLib = require('pdf-parse/lib/pdf-parse.js');
    console.log('Type of pdf-parse/lib/pdf-parse.js:', typeof pdfLib);
} catch (e) {
    console.log('Could not require pdf-parse/lib/pdf-parse.js', e.message);
}

async function test() {
    try {
        const buffer = Buffer.from('dummy pdf content');

        if (typeof pdf === 'function') {
            const data = await pdf(buffer);
            console.log('Success:', data.text);
        } else {
            console.log("Still not a function:", typeof pdf);
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

test();
