# Educational Content Editor as a Service

## Starting the editor locally

- `yarn mongodb:start` starts the MongoDB server.
- `yarn dev` starts the Next.js server on http://localhost:3000/.

## LTI Workflow

### Deep Linking

On a Deep Linking request, we show a simple form where the user can create a new
document. Returns with a Resource Link where `custom.state` is an empty
document.

### Resource Link

A resource link expects the following custom parameters:

```ts
interface CustomParameters {
  // The editor state as created by the Deep Linking form or later save requests.
  state: {
    version: number
    document: { plugin: string; state?: unknown }
  }
  // Whether the user should be able to save the document
  mayEdit?: 'true'
  // The endpoint that will be used when the user initiates a save. Should be set when mayEdit is true.
  saveUrl?: string
  // Arbitrary additional information that we should pass when the user iniates a save.
  // (e.g. user id, token, ...)
  savePayload?: unknown
}
```

If `mayEdit` is false, we only render the document. If `mayEdit` is true, we
also load the editor and show an edit button. When the user clicks "Save" after
editing a document, we do a POST request to the specified `saveUrl` with the
following JSON body:

```ts
interface SavePayload {
  // The (JSON) state of the document.
  state: {
    version: number
    document: { plugin: string; state?: unknown }
  }
  // The additional information that was specified via `savePayload`.
  payload: unknown
}
```

## Integration

- [Docker image](https://github.com/serlo/ece-as-a-service/pkgs/container/ece-as-a-service)
