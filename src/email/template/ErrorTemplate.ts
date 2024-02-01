function ErrorTemplate(error: Error, tags: string[]) {
  return `<div>
    <h1>Name: ${error.name}</h1>
    <h3>Message: ${error.message}</h3>
    <p>${error.stack}</p>
    <div>
    Tags: ${tags.map((tag) => `<span>${tag}</span>`)}
    </div>
  </div>`;
}

export default ErrorTemplate;
