"use client";

// Turns an uploaded CV into plain text, in the browser. Nothing is uploaded:
// PDFs are read with pdf.js (loaded only when needed), DOCX files are unzipped
// and their document XML stripped to text.

export const MAX_CV_BYTES = 5 * 1024 * 1024;
export const CV_ACCEPT = ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export class CvReadError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CvReadError";
    }
}

export async function readCvFile(file: File): Promise<string> {
    if (file.size > MAX_CV_BYTES) throw new CvReadError("That file is over 5 MB. A CV is usually much smaller; try exporting it again.");
    const name = file.name.toLowerCase();
    let text: string;
    if (name.endsWith(".pdf") || file.type === "application/pdf") text = await readPdf(file);
    else if (name.endsWith(".docx")) text = await readDocx(file);
    else if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) text = await file.text();
    else throw new CvReadError("DevRadar reads PDF, DOCX and plain text files.");

    text = text.replace(/ /g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (text.length < 80) {
        throw new CvReadError("There’s almost no text in that file. If it’s a scanned PDF, export your CV from its editor instead, or paste the text.");
    }
    return text;
}

async function readPdf(file: File): Promise<string> {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    let doc;
    try {
        doc = await task.promise;
    } catch {
        throw new CvReadError("That PDF couldn’t be opened. If it’s password-protected, export an unprotected copy.");
    }
    const pages: string[] = [];
    for (let n = 1; n <= Math.min(doc.numPages, 10); n++) {
        const page = await doc.getPage(n);
        const content = await page.getTextContent();
        // Rebuild lines from positioned text: same baseline, left to right
        const items = content.items
            .filter((item): item is typeof item & { str: string; transform: number[] } => "str" in item)
            .map((item) => ({ text: item.str, x: item.transform[4], y: Math.round(item.transform[5]) }))
            .filter((item) => item.text.trim());
        items.sort((a, b) => b.y - a.y || a.x - b.x);
        const lines: string[] = [];
        let lastY: number | null = null;
        for (const item of items) {
            if (lastY !== null && Math.abs(item.y - lastY) <= 2) lines[lines.length - 1] += ` ${item.text}`;
            else lines.push(item.text);
            lastY = item.y;
        }
        pages.push(lines.join("\n"));
    }
    await task.destroy();
    return pages.join("\n\n");
}

async function readDocx(file: File): Promise<string> {
    const { unzipSync, strFromU8 } = await import("fflate");
    let files: Record<string, Uint8Array>;
    try {
        files = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter: (f) => f.name === "word/document.xml" });
    } catch {
        throw new CvReadError("That DOCX file couldn’t be opened. Try saving it again, or export it as PDF.");
    }
    const xml = files["word/document.xml"];
    if (!xml) throw new CvReadError("That DOCX file has no document text.");
    return docxXmlToText(strFromU8(xml));
}

export function docxXmlToText(xml: string): string {
    return xml
        .replace(/<w:tab\/>/g, "\t")
        .replace(/<w:br[^>]*\/>/g, "\n")
        .replace(/<\/w:p>/g, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&");
}
