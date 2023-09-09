export function request(context) {
  console.log("hits request");
  return {
    resourcePath: "/storage.json",
    method: "GET",
  };
}

export function response(context) {
  console.log("hits response");
  console.log(context.result);
  /**
   * I need this from the object
   */
  return "It is a string";
}
