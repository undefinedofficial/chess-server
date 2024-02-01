import isObject from "../utils/isObject";
import { getParts, HttpResponse, MultipartField } from "uWebSockets.js";
import { limits } from "../configs";

interface UploadableBuffer {
  contentType: string;
  buffer: Buffer;
}

interface UploadableBufferMap {
  [key: string]: UploadableBuffer;
}

type ParseFormBodySignature = {
  res: HttpResponse;
  contentType: string;
};

// type FetchHTTPData = {
//   type: "start" | "stop";
//   payload: {
//     variables: any[]; // will be
//   };
// };

// const isFetchHTTPData = (body: any) => {
//   const validShape = isObject(body);
//   const validTypeField = ["start", "stop"].includes(body["type"]);
//   const validPayloadField = isObject(body["payload"]);
//   return validShape && validTypeField && validPayloadField;
// };

const parseRes = (res: HttpResponse) => {
  return new Promise<Buffer | null>((resolve) => {
    let buffer: Buffer;
    res.onData((ab, isLast) => {
      const curBuf = Buffer.from(ab);
      buffer = buffer
        ? Buffer.concat([buffer, curBuf])
        : isLast
        ? curBuf
        : Buffer.concat([curBuf]);
      // give an extra MB for the rest of the payload
      if (buffer.length > limits.AVATAR_SIZE * 2) resolve(null);
      if (isLast) resolve(buffer);
    });
  });
};

const parseFormBody = async ({
  res,
  contentType,
}: ParseFormBodySignature): Promise<MultipartField[] | null> => {
  // let parsedBody: unknown;
  // const parsedUploadables: UploadableBufferMap = {};
  const resBuffer = await parseRes(res);
  if (!resBuffer) return null;
  const parts = getParts(resBuffer, contentType);
  if (!parts) return null;
  return parts;
  // try {
  //   parts.forEach(({ name, data, type }) => {
  //     if (name === "body") {
  //       parsedBody = JSON.parse(Buffer.from(data).toString());
  //     } else if (name.startsWith("uploadables.")) {
  //       const [, key] = name.split(".");
  //       parsedUploadables[key!] = {
  //         contentType: type,
  //         buffer: Buffer.from(data),
  //       } as UploadableBuffer;
  //     }
  //   });
  // if (!isFetchHTTPData(parsedBody)) return null;

  // const validParsedBody = parsedBody as FetchHTTPData;
  // if (Object.keys(parsedUploadables).length) {
  //   validParsedBody.payload.variables = {
  //     ...validParsedBody.payload.variables,
  //     ...parsedUploadables,
  //   };
  // }
  // return validParsedBody;
  // } catch (e) {
  //   return null;
  // }
};

export default parseFormBody;
