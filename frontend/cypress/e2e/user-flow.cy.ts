describe('Основной пользовательский сценарий', () => {
  it('проходит полный путь пользователя', () => {
    cy.visit('/');
    cy.login();
    cy.uploadDocument();
    cy.startChat();
    cy.sendMessage();
    // ... проверка результатов
  });
}); 