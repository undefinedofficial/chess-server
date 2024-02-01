interface PageModel<T> {
  skip: number;
  limit: number;
  length: number;
  items: T[];
}
export default PageModel;
