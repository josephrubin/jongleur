# Jongleur

https://www.jongleur.app/

Your learning. As a musician. Simplified.

![Two hands playing a HUPFELD piano.](./asset/image/piano-practice-large.jpg)

## About

Jongleur helps musicians practice and track their hours by ingesting recordings and returning useful information and visuals. Currently we support Scarlatti solo sonatas.

## Development

### Initial setup

Most of the code is written in Typescript, so the setup is simply
```sh
npm i
```

If working on any Python files locally (a few files), you shouldn't
need to create a venv because one is provided in the source files.
Just run
```sh
. .jong/bin/activate
```
If the venv isn't working, you can try
```sh
rm -rf .jong
python3 -m venv .jong
pip install -r requirements.txt
. .jong/bin/activate
```
But if this is a common problem, we'll place the venv setup into
a shell script that will do this all for you (future).

A good deal of the workflow is supported by vscode, so **install the recommended vscode extensions.**

The settings should already configure eslint to run on save without
any further modification.

### Running the development server

Use the command
```sh
npm run dev
```

This will run the Remix web app **and** watch the graphql schema to regenerate Typescript types upon modification. It will also print
out the Jongleur "wordmark," just for fun. Try it!

Right now, we don't have emulation for the backend when developing locally.
You just run the web app locally but connect to the remote server.
This is generally fine (and it works because the web app has a hardcoded API key), but it requires having a working server running (see deployment below). Right now you can connect to the version running at jongleur.app but once the app is out of initial development this will have to change for security reasons.

This hardcoded API key expires every once in a while and has to be replaced, but the production server uses IAM authentication for our API which should never expire.

## Deployment

The command

```sh
npx cdk deploy
```

deploys the entire application to AWS (the front end, the backend, the GraphQl API, all together). This command handles
1. Boxing up the web app into a docker container and pushing
it to ECR
2. Starting the ECR image through ECS (Fargate)
3. Deploying the GraphQL API and its data resolvers
4. Creating the data stores themselves (databases, buckets, etc.)
and populating them with initial data
5. Creating the Cognito user pool
6. Etc.

But it deploys it by default to my AWS account and to my domain (jongleur.app). If you want to deploy
the app yourself, you should be able to do it just by changing these values in the infrastructure files.

Then you simply add the validation records to your DNS during deployment for the HTTPS certificate and the app should
be good to go.