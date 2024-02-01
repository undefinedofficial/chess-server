import fs from "fs";
import mime from "./mime-types";
import path from "path";
import { brotliCompressSync } from "zlib";
import isCompressible from "./isCompressible";
import { isCompress } from "../configs";

class StaticFileMeta {
  mtime: string;
  size: number;
  pathname: string;
  type: string;
  file?: Buffer;
  brotliFile?: Buffer;
  constructor(pathname: string, cacheFile?: boolean) {
    this.pathname = pathname;
    const { mtime, size } = fs.statSync(pathname);
    this.mtime = mtime.toUTCString();
    this.size = size;
    const ext = path.extname(pathname).slice(1);
    this.type = mime[ext] ?? "application/octet-stream";
    if (cacheFile) {
      this.file = fs.readFileSync(pathname);
      if (isCompress && isCompressible(pathname)) {
        this.brotliFile = brotliCompressSync(this.file);
      }
    }
  }
}

interface MetaDict {
  [filename: string]: StaticFileMeta;
}

interface Options {
  filesToCache: string[];
  staticPaths: string[];
}

interface PathNames {
  [filename: string]: string;
}

const makePathnames = (dirname: string, pathnames: PathNames, prefix: string) => {
  fs.readdirSync(dirname, { withFileTypes: true }).forEach((dirent) => {
    if (dirent.isFile()) {
      const key = prefix + dirent.name;
      pathnames[key] = path.join(dirname, dirent.name);
    } else if (dirent.isDirectory()) {
      makePathnames(
        path.join(dirname, dirent.name),
        pathnames,
        `${prefix}${dirent.name}/`
      );
    }
  });
};
export default class StaticServer {
  pathnames: PathNames = {};
  cachedFileSet: Set<string>;
  meta: MetaDict = {};
  constructor(options: Options) {
    const { filesToCache, staticPaths } = options;
    this.cachedFileSet = new Set(filesToCache);
    staticPaths.forEach((dirname) => {
      try {
        if (!fs.existsSync(dirname)) {
          fs.mkdirSync(dirname);
        }
        makePathnames(dirname, this.pathnames, "/");
      } catch (e) {
        console.log(e);
      }
    });
  }
  getMeta(filename: string) {
    const existingMeta = this.meta[filename];
    if (existingMeta) return existingMeta;
    const pathname = this.pathnames[filename];
    if (!pathname) return false;

    const cacheFile = !isCompress || this.cachedFileSet.has(filename);
    return (this.meta[filename] = new StaticFileMeta(pathname, cacheFile));
  }
}
