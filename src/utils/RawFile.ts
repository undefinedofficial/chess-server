import { readFileSync } from "fs";
import { isReleace, staticPath } from "../configs";
import { brotliCompressSync } from "zlib";

class RawFile {
  minifiedHTML: string;
  brotliHTML: Buffer;
  constructor(rawFile: string = "/index.html") {
    const htmlPath = staticPath + rawFile;
    const html = readFileSync(htmlPath, "utf8");
    // Hide staging & PPMIs from search engines
    const noindex = isReleace ? "" : `<meta name="robots" content="noindex"/>`;
    const extraHead = `${noindex}`;
    const devBody = isReleace
      ? `<script type="text/javascript"> (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date(); for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } } (k = e.createElement(t)), (a = e.getElementsByTagName(t)[0]), (k.async = 1), (k.src = r), a.parentNode.insertBefore(k, a); })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym"); ym(90934736, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true, }); </script> <noscript ><div> <img src="https://mc.yandex.ru/watch/90934736" style="position: absolute; left: -9999px" alt="" /></div ></noscript>` // scriptMetrica
      : "<!-- DEV -->";

    this.minifiedHTML = html
      .replace("<head>", `<head>${extraHead}`)
      .replace("</body>", `${devBody}</body>`);

    this.brotliHTML = brotliCompressSync(this.getRaw());
  }

  public getRaw() {
    return this.minifiedHTML;
  }
  public getBrotliRaw = () => {
    return this.brotliHTML;
  };
}
export default RawFile;
