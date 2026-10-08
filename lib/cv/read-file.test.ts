import { describe, expect, it } from "vitest";
import { docxXmlToText } from "./read-file";

describe("docxXmlToText", () => {
    it("keeps paragraphs, tabs and breaks, and decodes entities", () => {
        const xml =
            '<w:document><w:body><w:p><w:r><w:t>Senior Engineer</w:t></w:r><w:r><w:tab/><w:t>2021 &amp; on</w:t></w:r></w:p>' +
            "<w:p><w:r><w:t>React</w:t><w:br/><w:t>&lt;TypeScript&gt;</w:t></w:r></w:p></w:body></w:document>";
        expect(docxXmlToText(xml)).toBe("Senior Engineer\t2021 & on\nReact\n<TypeScript>\n");
    });
});
