import pdfParse from "pdf-parse";

export const extractPDFText = async (buffer) => {
  const data = await pdfParse(buffer);

  return data.text;
};