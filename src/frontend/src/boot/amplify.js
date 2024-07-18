import { boot } from 'quasar/wrappers'

import { Amplify } from 'aws-amplify';
import awsconfig from '../aws-exports';

Amplify.configure(awsconfig);

export default boot(async ({ app }) => {
    // optional: attach Amplify to Vue instance
    app.config.globalProperties.$Amplify = Amplify;
})
