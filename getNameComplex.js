import { util } from "@aws-appsync/utils";

export function request(context) {
  console.log("hits request");
  return {
    resourcePath: "/storage.json?select&select-type=2",
    method: "POST",
    params: {
      headers: {
        "Content-Type": "application/xml",
      },
      body: `
        <?xml version="1.0" encoding="UTF-8"?>
        <SelectObjectContentRequest xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
          <Expression>SELECT s.name FROM S3Object[*].records[*] AS s WHERE s.id = '${context.arguments.id}';</Expression>
          <ExpressionType>SQL</ExpressionType>
          <RequestProgress>
            <Enabled>false</Enabled>
          </RequestProgress>
          <InputSerialization>
            <CompressionType>NONE</CompressionType>
            <JSON>
              <Type>DOCUMENT</Type>
            </JSON>
          </InputSerialization>
          <OutputSerialization>
            <JSON />
          </OutputSerialization>
        </SelectObjectContentRequest>
      `,
    },
  };
}

export function response(context) {
  /**
   * Because of the way the response gets buffered, and the
   * small number of tools accessible within APPSYNC_JS execution environment.
   * It was easier to split the string and parse the JSON.
   *
   * It might require further work if you want to do more complex queries.
   */
  const [_, result] = context.result.body.split("octet-stream");
  const [unparsedString] = result.split("\n");

  /**
   * I need this from the object
   */
  return JSON.parse(unparsedString).name;
}
