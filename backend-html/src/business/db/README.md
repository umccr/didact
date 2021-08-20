Note: the use of dynamodb-onetable here is *entirely experimental* and
could turn out to be a terrible mistake.

The rationale is that Dynamo provides an excellent scaleable yet cheap
data store - especially for sites that have low volume usage like these
prototypes.

Can easily pivot to just using a SQL db if needed.
