import pageModel from "../types/pageModel";

function sendPageModel<T>(model: pageModel<T>) {
  return JSON.stringify(model);
}

export default sendPageModel;
