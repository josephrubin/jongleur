# Jongleur

[jongleur.app](https://www.jongleur.app/)

Your learning. As a musician. Simplified.

![Two hands playing a HUPFELD piano.](./asset/image/piano-practice-large.jpg)

## About

Jongleur helps musicians practice and track their hours by ingesting recordings and returning useful information and visuals. Currently we support Scarlatti solo sonatas.

## Development

### Initial setup

Most of the code is written in Typescript, so the setup is simply
```sh
$ npm i
```

A good deal of the workflow is supported by vscode, so **install the recommended vscode extensions.** The settings should already configure eslint to run on save without
any further modification.


If working on any Python files locally (a few files), you'll need
ffmpeg. On MacOS, for example:
```sh
$ brew update
$ brew install ffmpeg
```
(You may need some other libraries depending on your exact setup; if so, install them and feel free to add them to this README!).
You'll also want pipenv (`pip3 install pipenv`) so you can use the virtual
environment:
```sh
$ pipenv install
$ pipenv shell
```

### Running the development server

Use the command
```sh
$ npm run dev
```

This will run the Remix web app **and** watch the graphql schema to regenerate Typescript types upon modification. It will also print
out the Jongleur "wordmark," just for fun. Try it!

Right now, we don't have emulation for the backend when developing locally.
You just run the web app locally but connect to the remote server.
This is generally fine, but it requires having a working server running (see deployment below). Right now you can connect to the version running at jongleur.app but once the app is out of initial development this will change.

## Deployment

The command

```sh
$ npm run deploy
```

deploys the entire application to AWS (the front end, the backend, the GraphQL API, and more, all together). This command handles
1. Boxing up the web app into a docker container and pushing
it to ECR
2. Starting the ECR image through ECS (Fargate)
3. Deploying the GraphQL API and its data resolvers
4. Creating the data stores themselves (databases, buckets, etc.)
and populating them with initial data
5. Creating the Cognito user pool
6. Launching all the misc lambdas and rest APIs
7. Etc

But it deploys it by default to my AWS account and to my domain (jongleur.app). If you want to deploy
the app yourself, you should be able to do it just by changing these values in `infrastructure/bin/jongleur-infrastructure.ts`.

Then you simply add the validation records to your DNS during deployment for the HTTPS certificate (see the ACM panel in your AWS console) and the 
app should be good to go. If you're asked to bootstrap your CDK environment
when attempting to deploy, do it.

## Staging

Following what I curently consider to be best practice, if you want to have {`prod`, `stage`, `qa`, etc.} environments, you should deploy the
identical stack to separate accounts.
It should be simple enough to set up a couple different deployment commands to choose the appropriate account, but that hasn't been done since this app has no active user-base yet! But soon!