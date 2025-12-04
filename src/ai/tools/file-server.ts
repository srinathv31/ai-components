import { z } from "zod";
import { tool } from "ai";
import { readFile } from "@/data/file-server";

export const readFileTool = tool({
  description: "Read a file from the file server",
  inputSchema: z.object({
    filePath: z.string().describe("The path to the file to read"),
  }),
  execute: async ({ filePath }) => {
    const fileContent = await readFile(filePath);
    return { fileContent };
  },
});
