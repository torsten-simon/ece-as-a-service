beforeEach(() => {
  cy.task('initEdusharingServer')
})

it('The editor can be called via the LTI Workflow', () => {
  openSerloEditorWithLTI()

  cy.contains('Benannte Version speichern')
})

it('Button "Saved named version" saves a named version', () => {
  openSerloEditorWithLTI()

  cy.contains('Benannte Version speichern').click()
  cy.get('input[placeholder="Name der neuen Version"]').type('version-name')
  cy.contains(/^Speichern$/).click()
  cy.contains(/^Speichern$/).should('not.exist')

  cy.task('getSavedVersionsInEdusharing').then((savedVersions) => {
    expect(savedVersions)
      .to.be.an('array')
      .that.deep.includes({ comment: 'version-name' })
  })
})

it('Assets from edu-sharing can be included', () => {
  openSerloEditorWithLTI()

  embedEdusharingAsset()

  cy.contains('Inhalt von edu-sharing')
})

describe('Including assets from edu-sharing', () => {
  it('fails when edu-sharing has not provided a dataToken in the LTI flow', () => {
    cy.task('deleteDataToken')

    openSerloEditorWithLTI()
    embedEdusharingAsset()

    cy.getIframe().contains('dataToken is not set')
  })
})

function embedEdusharingAsset() {
  cy.get('div.add-trigger').eq(1).click()
  cy.contains('Edusharing Inhalte').click()
  cy.contains('Datei von edu-sharing einbinden').click()
  // TODO: Find a way around this wait
  cy.wait(6000)
}

function openSerloEditorWithLTI() {
  cy.visit('http://localhost:8100')
}

export {}
