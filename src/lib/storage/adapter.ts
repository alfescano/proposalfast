export type StoredObject = {
  key: string;
  url?: string;
};

export interface StorageAdapter {
  readonly provider: string;
  put(input: {
    key: string;
    body: Buffer | Uint8Array | string;
    contentType: string;
  }): Promise<StoredObject>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
}
