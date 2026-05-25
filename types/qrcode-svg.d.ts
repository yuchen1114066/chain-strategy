declare module "qrcode-svg" {
  interface QRCodeOptions {
    content: string;
    width?: number;
    height?: number;
    padding?: number;
    color?: string;
    background?: string;
    ecl?: "L" | "M" | "Q" | "H";
    join?: boolean;
    container?: "svg" | "svg-viewbox" | "g" | "none";
    xmlDeclaration?: boolean;
  }
  class QRCode {
    constructor(options: QRCodeOptions | string);
    svg(opt?: { container?: string }): string;
  }
  export default QRCode;
}
