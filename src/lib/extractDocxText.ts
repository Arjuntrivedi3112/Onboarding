import mammoth from "mammoth";

export async function extractDocxText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer || typeof arrayBuffer === "string") {
          reject("Invalid file data");
          return;
        }
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        resolve(value);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
