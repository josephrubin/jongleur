/**
 * AppSync makes us choose an authorization type for our API but none
 * of them are really appealing.
 * API keys are bad because they expire.
 * IAM is bad because we can't configure our container with the appropriate IAM
 * role unless we use the Amplify AppSync client library.
 *
 * We really just want an open API that our container can use and that we can
 * use with local development, so for now we just return true. We have no real
 * reason to lock down this API.
 *
 * In the future we may wish to do our User authentication here instead of in
 * our resolver for AppSync requests that try to get User information.
 */
const lambdaHandler: () => object = async () => {
  return {
    isAuthorized: true,
  };
};

exports.lambdaHandler = lambdaHandler;
