declare module "mammoth" {
  export interface ConversionResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface MammothInstance {
    convertToHtml(
      input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer } | { path: string },
      options?: any
    ): Promise<ConversionResult>;
    extractRawText(
      input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer } | { path: string },
      options?: any
    ): Promise<ConversionResult>;
  }

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer } | { path: string },
    options?: any
  ): Promise<ConversionResult>;

  export function extractRawText(
    input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer } | { path: string },
    options?: any
  ): Promise<ConversionResult>;

  const mammoth: MammothInstance & {
    convertToHtml: typeof convertToHtml;
    extractRawText: typeof extractRawText;
  };
  export default mammoth;
}
