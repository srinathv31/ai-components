import { ReadFileResponse } from "./file-server.types";

// function to read a file from the file server via the API
export async function readFile(filePath: string): Promise<ReadFileResponse> {
  const response = await fetch(
    `http://localhost:3000/api/file-server?filePath=${filePath}`,
    {
      method: "GET",
    }
  );
  const fileContent = await response.text();
  return { fileContent };
}
