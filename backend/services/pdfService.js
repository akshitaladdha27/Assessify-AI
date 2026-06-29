import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

import fs from "fs";

console.log("Target file:", targetFilePath);
console.log("Exists:", fs.existsSync(targetFilePath));

export const extractPDFText = async (filePath) => {
  const loader = new PDFLoader(filePath);

  const docs = await loader.load();

  return docs.map(doc => doc.pageContent).join("\n");
};