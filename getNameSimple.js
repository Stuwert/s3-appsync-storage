export function request() {
  return {
    resourcePath: "/storage.json",
    method: "GET",
  };
}

export function response(context) {
  const parsedResult = JSON.parse(context.result.body);

  const character = parsedResult.records.find(
    (record) => record.id === context.arguments.id
  );

  return character.name;
}
