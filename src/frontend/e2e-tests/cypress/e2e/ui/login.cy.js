describe('Sign In', () => {

  const username = 'Delpipi';
  const password = 'delpipi@2024';


  it('Should successfully login with valid usename and password', () => {
    cy.visit('http://localhost:9002/#/')

    //Click on Create Account link
    cy.get('button#signIn-tab').contains('Sign In').click();

    cy.wait(100);
    cy.get('input[name="username"]').type(username);

    cy.get('input[name="password"]').type(password);

    cy.get('button[data-amplify-button=""]').contains('Sign in').click();

    // Verify the welcome message
    cy.contains(`Hello ${username}!`, { timeout: 10000 }).should('be.visible');
  })


  it('Should fail login with wrong username or passowrd', () => {
    cy.visit('http://localhost:9002/#/')

    //Click on Create Account link
    cy.get('button#signIn-tab').contains('Sign In').click();

    cy.get('input[name="username"]').type("username");
    cy.get('input[name="password"]').type("delpipi2023");

    cy.get('button[data-amplify-button=""]').contains('Sign in').click();

    cy.get('.text-negative').should('contain', 'Incorrect username or password');

  })
});