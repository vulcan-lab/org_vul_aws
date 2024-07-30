// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import { Amplify } from "aws-amplify";
import { signIn, fetchAuthSession, fetchUserAttributes} from "aws-amplify/auth";
import awsconfig from '../../../aws-exports';

Amplify.configure(awsconfig);

Cypress.Commands.add('signIn', (username, password, userPoolWebClientId) =>{
    return signIn({username: username, password: password}).then((user) => {
        return fetchAuthSession().then((session) => {
            const idToken = session.tokens.idToken;
            localStorage.setItem(`CognitoIdentityServiceProvider.${userPoolWebClientId}.LastAuthUser`, username);
            localStorage.setItem(`CognitoIdentityServiceProvider.${userPoolWebClientId}.${username}.idToken`, idToken);
        });
    });
});

Cypress.Commands.add('getUserId', () => {
    return fetchUserAttributes().then((attributes) => {
        return attributes.sub;
    });
})