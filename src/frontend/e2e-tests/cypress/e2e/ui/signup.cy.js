describe('Sign up', () => {
  const name = 'Kouame Alexandre Paul';
  const username = 'Delpipi';
  const password = 'delpipi@2024';
  const phone_number = '0504888547';
  const email = 'alexandrepaulkouame@gmail.com';
  const country_code = "+225";

  it('Should successfully sign up with valid credentials and custom fields', () => {
    cy.visit('http://localhost:9002/#/')

    //Click on Create Account link
    cy.get('button[id="signUp-tab"]').click();

    cy.get('input[name="name"]').type(name);
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('input[name="confirm_password"]').type(password);
    cy.get('select[name="country_code"]').select(country_code);
    cy.get('input[name="phone_number"]').type(phone_number);
    cy.get('input[name="email"]').type(email);

    cy.get('button[style="border-radius: 0px; font-weight: normal;"]').contains('Create Account').click();

    // Verify the welcome message
    cy.contains(`Hello ${username}!`).should('be.visible');
  })


  it('Should fail sign up with missing custom fields', () => {
    cy.visit('http://localhost:9002/#/')

     //Click on Create Account link
     cy.get('button[id="signUp-tab"]').click();

    cy.get('input[name="name"]').type(name);
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('input[name="confirm_password"]').type(password);
    // cy.get('select[name="country_code"]').select(country_code);
    // cy.get('input[name="phone_number"]').type(phone_number);
    // cy.get('input[name="email"]').type(email);

    cy.get('button[style="border-radius: 0px; font-weight: normal;"]').contains('Create Account').click();

    cy.contains('Email is required').should('be.visible');
    cy.contains('Phone number is required').should('be.visible');
  })
});