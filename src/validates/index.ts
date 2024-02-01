import Ajv, { JSONSchemaType, Schema } from "ajv";
import ajvErrors from "ajv-errors";

const ajv = ajvErrors(new Ajv({ allErrors: true }));

ajv.addFormat("email", /^[-\w.]+@([A-z0-9][-A-z0-9]+\.)+[A-z]{2,4}$/); // validate email

ajv.addFormat("name", {
  type: "string",
  validate: (data) => data.length === 0 || /[A-Za-zа-яА-ЯёЁ]{0,16}/.test(data),
}); // validate email

ajv.addFormat("nickname", /^[a-zA-Z][a-zA-Z0-9\.]{4,24}$/); // validate nickname only on english, first always symbol only, min length 5, max length 24

ajv.addFormat("password", /(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/); // validate password symbol minimal one uppercase minimal one lowwercase

function validate<TSchema>(schema: JSONSchemaType<TSchema> | Schema) {
  return ajv.compile<TSchema>(schema);
}
export * from "../validates/schemas";

export default validate;
