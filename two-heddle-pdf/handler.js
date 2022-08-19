'use strict';

const PDFKIT = require("pdfkit");

module.exports.generate_pdf = async (event) => {
    const text = 'Two Heddle threading diagram';

    return new Promise(resolve => {
        const doc = new PDFKIT();

        doc.text(text)

        const buffers = []

        doc.on("data", buffers.push.bind(buffers))
        doc.on("end", () => {
            const pdf = Buffer.concat(buffers)
            const response = {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/pdf",
                },
                body: pdf.toString("base64"),
                isBase64Encoded: true,
            }
            resolve(response);
        })

        doc.end()
    });
}
