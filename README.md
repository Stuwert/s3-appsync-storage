## Overview

I was talking with a coworker about implementation patterns for some simple config data and I hypothesized using Appsync connected to an S3 bucket using S3 querying. We have some data we want to store without a clear home and with some long lived very infrequently modified records. Using a database seemed like overkill and the versioning that S3 provides (so we theoretically wouldn't have to implement any of that ourselves). However, I realize I've never actually done this before, so I wanted to spin up a sample implementation to see how straightforward it is or isn't.

The basic idea here is S3 storing a simple JSON file using a uuid and some data, and seeing how easy it is to implement things like querying using S3.

### Implementation Steps

[x] Uploading a simple file to S3
[x] Using S3 Querying to collect data from that file
[] Implementing Appsync with an HTTP DataSource
[] Adding Querying via the data source
[] Creating and uploading a file to S3 from the same Appsync Template

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

The one takeaway I noted here however is that I would have
