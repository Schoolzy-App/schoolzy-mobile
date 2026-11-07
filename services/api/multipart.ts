/**
 * React Native's FormData takes `{ uri, name, type }` for file parts. The cast
 * is required because the DOM lib types `append` as accepting only Blob/string.
 */
export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

export function appendFile(form: FormData, field: string, file: UploadFile) {
  form.append(field, file as unknown as Blob);
}
