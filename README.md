## Overview

I was talking with a coworker about implementation patterns for some simple config data and I hypothesized using Appsync connected to an S3 bucket using S3 querying. We have some data we want to store without a clear home and with some long lived very infrequently modified records. Using a database seemed like overkill and the versioning that S3 provides (so we theoretically wouldn't have to implement any of that ourselves). However, I realize I've never actually done this before, so I wanted to spin up a sample implementation to see how straightforward it is or isn't.

The basic idea here is S3 storing a simple JSON file using a uuid and some data, and seeing how easy it is to implement things like querying using S3.

https://gist.github.com/wulfmann/82649af0d9fa7a0049ff8dd1440291e4

I saw this CDK setup and I figured it would be possible to replicate with some tweaks to actually Query the data directly from S3.

[If you want a longer form writeup about the experience, you can find it here](https://www.urback.net/posts/hooking-up-aws-appsync-to-s3-in-6-hours-ish/)

### Implementation Steps

[x] Uploading a simple file to S3
[x] Using S3 Querying to collect data from that file
[x] Implementing Appsync with an HTTP DataSource
[x] Adding Querying via the data source
[x] Creating and uploading a file to S3 from the same Appsync Template

## Goal 1: Uploading File and Querying

Uploading the file was relatively easy, but I struggled to figure out how to accurately query the file for the data.

The way the JSON is structured is slightly less "sql-y" in my head than CSV (though I think slightly more human readable). I struggled most to try to understand how to actually query the records data of the row. At one point I tried to remove the parent object altogether and just have an array of objects, but then S3 coalesced them all into a single response anyway within the JSON.

The key for me was the following document https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-select-sql-reference-select.html, and learning that I would have to do `FROM S3Object[*]`. Once I got that simple query working:

```
SELECT s.* FROM S3Object[*].records AS s;
```

I was able to extrapolate it into a query that would give me the one specific thing I wanted.

```
SELECT s.name FROM S3Object[*].records[*] AS s WHERE s.id = 'd9c9e7f6-8d3d-4a5d-9d3c-1b7e3c8a8c1a';
```

The one takeaway I noted here however is that I would have to actually grab the name from the response as the response is an object.

```
{
  name: "Tess"
}
```

## Goal 2: Requesting Data From S3

So I set up a basic template with the following components:

- Resolver
- DataSource
- GraphqlApi
- Schema
- Policy

To connect the pieces. I started by hardcoding all of the things because I didn't want to deal with

At first I tried a pretty basic GET Method passing in the body, until I realized that absolutely wasn't working. So I re-ran the request in the test environment on AWS and copied the request body.

```
export function request(context) {
  return {
    method: "GET",
    params: {
      body: `SELECT s.name FROM S3Object[*].records[*] AS s WHERE s.id = '${context.arguments.id}';`,
    },
    resourcePath: "/storage.json",
  };
}
```

When I started debugging the issues after copying the work together, I learned that my Appsync function wasn't generating logs because it didn't have the correct permissions to generate groups.

During this process I also spent way too long fighting the Authorization parameters to actually access the bucket, until I re-reviewed some of the work I was referencing to realize there's an authorization config setting I was not using.

I got it functional!

The extra snafu was that the response object was a Buffered string, and Appsync resolvers don't actually have any tools to automatically parse a buffered string, so I had to get a little hacky with how I actually grabbed the result.

I was also somewhat disappointed with the speed. I was hoping for better than 200ms response times. <300ms certainly isn't bad, but it's not blazing fast, and I was hoping for slightly better.

## Bonus: Implementing A Generic Grabber and then Loading

I also added the basic `getNameSimple.js` to show an example of loading the entire JSON file into memory and then looping over it and returning the result. Given the relatively similar speeds and the simplicity of the code being written, I would probably lean towards that in production situations.

## Goal 3: Upload to S3

I did a bit more research, and I'm not going to go through all of the steps here to upload the file to s3.

I would probably use this Github Action: https://github.com/marketplace/actions/upload-s3 to manually upload the file. If it's versioned, the configuration in AWS will manage all of the stuff like updating the access, and it's up to you at that point whether or not controlling the files via version control in Git is also useful.

What I have done however, is create an S3 bucket configuration that implicitly connects the pieces to the various resources, instead of hardcoding variables.
