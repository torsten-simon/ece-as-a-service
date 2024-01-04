import { useEffect, useRef, useState } from 'react'
import { EdusharingAssetProps } from '.'
import { EdusharingAssetDecoder } from '../../../shared/decoders'
import { PluginToolbar, PluginDefaultTools } from '@serlo/editor'
import Modal from 'react-modal'
import { EdusharingAssetRenderer } from './renderer'

export function EdusharingAssetEditor({
  state,
  focused,
  config,
  id,
}: EdusharingAssetProps) {
  const [modalIsOpen, setModalIsOpen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>()
  const { edusharingAsset, height } = state

  useEffect(() => {
    function handleIFrameEvent({ data, source }: MessageEvent) {
      if (source !== iframeRef.current?.contentWindow) return

      if (typeof data === 'object' && EdusharingAssetDecoder.is(data)) {
        const newEdusharingAsset = {
          nodeId: data.nodeId,
          repositoryId: data.repositoryId,
        }

        if (state.edusharingAsset.defined === false) {
          state.edusharingAsset.create(newEdusharingAsset)
        } else {
          // TODO: Better implementation
          state.edusharingAsset.nodeId.set(newEdusharingAsset.nodeId)
          state.edusharingAsset.repositoryId.set(
            newEdusharingAsset.repositoryId,
          )
        }

        setModalIsOpen(false)
      }
    }

    window.addEventListener('message', handleIFrameEvent)

    return () => window.removeEventListener('message', handleIFrameEvent)
  }, [state.edusharingAsset])

  return (
    <>
      {renderPluginToolbar()}
      {renderModal()}
      <EdusharingAssetRenderer
        nodeId={
          state.edusharingAsset.defined
            ? state.edusharingAsset.nodeId.value
            : undefined
        }
        repositoryId={
          state.edusharingAsset.defined
            ? state.edusharingAsset.repositoryId.value
            : undefined
        }
        ltik={config.ltik}
        height={height.value}
      />
      {!edusharingAsset.defined || focused ? (
        <div className="edusharing-w-full edusharing-relative">
          <div className="edusharing-flex edusharing-flex-col edusharing-items-center edusharing-absolute edusharing-bottom-2 edusharing-left-2">
            <button
              className="edusharing-ece-button-blue edusharing-text-sm"
              onClick={() => setModalIsOpen(true)}
              data-testid="edusharing-plugin-button"
            >
              Datei von edu-sharing einbinden
            </button>
          </div>
        </div>
      ) : null}
    </>
  )

  function renderPluginToolbar() {
    if (!focused) return null

    return (
      <PluginToolbar
        pluginType="Edu-sharing Inhalt"
        pluginControls={<PluginDefaultTools pluginId={id} />}
        pluginSettings={
          <>
            <button
              onClick={() =>
                height.set((currentValue) => Math.min(currentValue + 2, 100))
              }
              className="edusharing-mr-2 edusharing-rounded-md edusharing-border edusharing-border-gray-500 edusharing-px-1 edusharing-text-sm edusharing-transition-all hover:edusharing-bg-editor-primary-200 focus-visible:edusharing-bg-editor-primary-200"
              data-qa="plugin-edusharing-bigger-button"
            >
              Größer
            </button>
            <button
              onClick={() =>
                height.set((currentValue) => Math.max(currentValue - 2, 2))
              }
              className="edusharing-mr-2 edusharing-rounded-md edusharing-border edusharing-border-gray-500 edusharing-px-1 edusharing-text-sm edusharing-transition-all hover:edusharing-bg-editor-primary-200 focus-visible:edusharing-bg-editor-primary-200"
              data-qa="plugin-edusharing-smaller-button"
            >
              Kleiner
            </button>
          </>
        }
      />
    )
  }

  function renderModal() {
    if (!modalIsOpen) return

    // See https://reactcommunity.org/react-modal/accessibility/
    Modal.setAppElement(document.getElementsByTagName('body')[0])

    // TODO: Create helper function
    const url = new URL(window.location.origin)

    url.pathname = '/lti/start-edusharing-deeplink-flow'
    url.searchParams.append('ltik', config.ltik)

    return (
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        style={{
          content: {
            width: '80%',
            height: '80vh',
            top: '50%',
            left: '50%',
            bottom: 'auto',
            right: 'auto',
            transform: 'translate(-50%, -50%)',
          },
          overlay: {
            zIndex: 100,
          },
        }}
      >
        <iframe
          src={url.href}
          className="edusharing-h-full edusharing-w-full"
          ref={iframeRef}
        />
      </Modal>
    )
  }
}
