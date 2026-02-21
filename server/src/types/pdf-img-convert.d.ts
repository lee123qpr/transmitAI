declare module 'pdf-img-convert' {
    export function convert(pdf: string | Uint8Array | Buffer, options?: any): Promise<string[] | Uint8Array[]>;
}
