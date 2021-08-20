# didact

A prototype website playing the role of a data access committee
in a theoretical genomic data sharing federation.

## Development

It is possible to do all dev locally with only AWS access needed by the backend for data
operations (DynamoDb etc).

For complete stack work, open two terminals - one for running the backend, one for building
the frontend.

When run locally the backend will automatically look across into the correct spot in the
frontend folder to serve files (this obviously is different once deployed).

### Build the Frontend

```shell
cd frontend
npm run build:dev
```

### Run the Backend

```shell
cd backend-html
aws sso login --profile umccr-dev
 ... <get AWS credentials into current env (aws2-wrap etc)> ...
npm run dev
```

outputs

```
> backend-html@0.0.0 dev
> cross-env NODE_ENV=development nodemon

[nodemon] 2.0.7
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): src/**/* .env
[nodemon] watching extensions: js,ts,json
[nodemon] starting `ts-node --transpile-only --require dotenv/config src/bootstrap-local.ts`
🚀 App listening on the port 3000
```

Note that because the backend is running in `nodemon` it will automatically recompile
and re-run on changes to the source, so feel free to edit away. Occasionally if you
fundamentally change the folder structure it gets confused, but simply Ctrl-C and restart.


### Build the Frontend in Watch Mode (TODO)

`craco` doesn't seem to understand compiling the frontend in a 'watch' mode (which is for
instance allowed using `rescripts`). However, `craco` is needed for `tailwind` support so
currently rather than allowing the TS compiler to sit in watch mode, it does need to be
triggered manually.

## Publish

Currently set up only for build/deploy from local machine.

### Publish the docker images

Rather than build the docker images using CDK, we split this step out (could revisit).

So the backend-html image *includes* the frontend React as a set of files in the image.
That means the frontend needs to be built first.
