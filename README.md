# Introduction

The "Instrument Amp" is an extension of the [The Instrument Project](https://github.com/jimomulloy/instrument/wiki/The-Instrument) and aims to deliver some of that Audio processing functionality to internet users as a web application backed by services on the cloud.

[instrumentamper](https://github.com/jimomulloy/instrumentamper) is an additional github project that aims to provide a client side web app. This is implemented as an AWS Amplify based React Javascript web browser application to deliver Authenticated access to the backend system. AWS Amplify services include a Cognito based User registration and access control sub system. 

The AWS Amplify **Console** is used to configure a simple CI/CD process to trigger a build and deploy pipeline on Github project main branch commit.
The AWS Amplify Console "Hosting" is also used to configure CloudFront CDN and Route53 internet domain registration and web content delivery.

The web app interacts with an AWS S3 object store which in turn generates event that trigger actions on a Lambda function that makes calls into the **instrument** core library functions. Input and output Media files are persisted on the S3 store.

(For more details on technical aspects of the server side implementation pPlease refer to the project [Instrument Project README](https://github.com/jimomulloy/instrument#readme).

# AWS Amplify

The project is built with the tools and framwork provided by [AWS Amplify](https://aws.amazon.com/amplify/?nc=sn&loc=0)

This includes using:
* Amplify **CLI** to initialise the Github project and create and push backend service infrastructure to the cloud.
* Amplify **UI** to enhanced the React javasript client app UI.
* Amplify **Console** to set up web hosting and a CD build and deploy pipeline, automiticall treigger on Github push to main branch.

The project uses an EXISTING S3 Bucket that is already created by the instrument/instrument-aws/instrument-s3handler-cdk project module.

Therefore, rather than use the built in Amplify storage it is necessary to create IAM roles and link the Amplify sub system to the external bucket as descrobed here:

* https://dev.to/onlybakam/aws-amplify-how-to-interact-with-an-existing-s3-bucket-3mb1
* https://docs.amplify.aws/cli/storage/import/


# React App 

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
