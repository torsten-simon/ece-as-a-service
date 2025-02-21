import {
  Editor as Edtr,
  useScopedDispatch,
  useScopedSelector,
  useScopedStore,
} from '@edtr-io/core'
import { Renderer } from '@edtr-io/renderer'
import {
  getPendingChanges,
  hasPendingChanges as hasPendingChangesSelector,
  hasRedoActions,
  hasUndoActions,
  persist,
  serializeRootDocument,
} from '@edtr-io/store'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useDebounce } from 'rooks'

import { Layout } from '../layout'
import { createPlugins } from '../plugins'
import { StorageFormat, documentType } from '../storage-format'
import { Toolbar } from './toolbar'
import { SaveVersionModal } from './save-version-modal'
import { EdusharingConfig } from '../plugins/edusharing-asset'

export interface EditorProps {
  state: StorageFormat
  ltik: string
  providerUrl: string
  edusharingConfig: EdusharingConfig
}

export function Editor(props: EditorProps) {
  return (
    <Edtr
      plugins={createPlugins(props.edusharingConfig)}
      initialState={props.state.document}
    >
      {(document) => {
        return (
          <EditInner {...props} version={props.state.version}>
            {document}
          </EditInner>
        )
      }}
    </Edtr>
  )
}

function EditInner({
  children,
  ltik,
  state,
  providerUrl,
  edusharingConfig,
}: { children: ReactNode; version: number } & EditorProps) {
  const [isEditing, setIsEditing] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveVersionModalIsOpen, setSaveVersionModalIsOpen] = useState(false)

  const dispatch = useScopedDispatch()
  const store = useScopedStore()
  const undoable = useScopedSelector(hasUndoActions())
  const redoable = useScopedSelector(hasRedoActions())
  const pendingChanges = useScopedSelector(getPendingChanges())
  const hasPendingChanges = useScopedSelector(hasPendingChangesSelector())
  const formDiv = useRef<HTMLDivElement>(null)

  const save = useCallback(
    async (comment?: string) => {
      if (isSaving) return
      setIsSaving(true)

      try {
        const saveUrl = new URL(`${providerUrl}/lti/save-content`)

        if (comment) {
          saveUrl.searchParams.append('comment', comment)
        }

        const body: StorageFormat = {
          type: documentType,
          version: state.version,
          document: serializeRootDocument()(store.getState()),
        }

        const response = await fetch(saveUrl.href, {
          method: 'POST',
          headers: { Authorization: `Bearer ${ltik}` },
          keepalive: true,
          body: JSON.stringify(body),
        })
        if (response.status === 200) {
          dispatch(persist())
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsSaving(false)
      }
    },
    [dispatch, ltik, providerUrl, state.version, store, isSaving]
  )
  const debouncedSave = useDebounce(save, 5000)

  useEffect(() => {
    void debouncedSave()
  }, [debouncedSave, pendingChanges])

  useEffect(() => {
    window.onbeforeunload = () => {
      if (hasPendingChanges) {
        void save('Datei wurde durch den Serlo-Editor aktualisiert')
      }
    }
  }, [hasPendingChanges, save])

  if (!isEditing) {
    return (
      <>
        <Toolbar mode="render" setIsEditing={setIsEditing} />
        <Layout>
          <Renderer
            plugins={createPlugins(edusharingConfig)}
            state={state.document}
          />
        </Layout>
      </>
    )
  }

  return (
    <>
      <SaveVersionModal
        save={save}
        open={saveVersionModalIsOpen}
        setOpen={setSaveVersionModalIsOpen}
      />
      <Toolbar
        mode="edit"
        setIsEditing={setIsEditing}
        setSaveVersionModalIsOpen={setSaveVersionModalIsOpen}
        undoable={undoable}
        redoable={redoable}
        save={save}
        isSaving={isSaving}
      />
      <Layout>{children}</Layout>
      {renderExtraEditorStyles()}
      <div ref={formDiv} />
    </>
  )

  function renderExtraEditorStyles() {
    return (
      <style jsx global>{`
        .fa-4x {
          color: rgb(175, 215, 234);
          width: 3rem;
        }

        div[data-document] h3 {
          margin-top: 1.5rem;
        }

        /* fixes bug in chromium based browsers v105+ */
        /* https://github.com/ianstormtaylor/slate/issues/5110#issuecomment-1234951122 */
        div[data-slate-editor] {
          -webkit-user-modify: read-write !important;
        }
      `}</style>
    )
  }
}
