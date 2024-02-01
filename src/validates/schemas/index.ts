const nickSchema = {
  type: "string",
  format: "nickname",

  errorMessage: {
    format: "invalid nickname",
  },
};

const emailSchema = {
  type: "string",
  format: "email",

  errorMessage: {
    format: "invalid email",
  },
};

const passwordSchema = {
  type: "string",
  format: "password",

  errorMessage: {
    format: "invalid password, min 8 letters, symbol minimal one uppercase minimal one lowwercase",
  },
};

const captchaSchema = {
  type: "string",
  minLength: 8,
  maxLength: 1024,
  errorMessage: {
    minLength: "invalid captcha",
    maxLength: "invalid captcha",
  },
};

const locationSchema = {
  type: "string",
  minLength: 2,
  maxLength: 3,
  errorMessage: "invalid location",
};
const nameSchema = {
  type: "string",
  format: "name",
};

export { nickSchema, emailSchema, passwordSchema, captchaSchema, locationSchema, nameSchema };
