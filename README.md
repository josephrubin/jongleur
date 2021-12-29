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

If working on any Python files locally (a few files), additionally run
```sh
pip install -r requirements.txt
```

A good deal of the workflow is supported by vscode, so **install the recommended vscode extensions.**

Our settings should already configure eslint to run on save without
any further modification.

### Running the development server

Use the command
```sh
npm run dev
```

This will run the Remix web app and watch the graphql schema to regenerate Typescript types upon modification.