import { GetServerSideProps } from 'next'

import { kitchenSink } from '../fixtures/kitchen-sink'
import { Layout } from '../layout'
import { MigratableState, migrate } from '../migrations'
import { plugins } from '../plugins'
import { getJsonBody } from '../utils/get-json-body'
import { Renderer } from '@edtr-io/renderer'
import dynamic from 'next/dynamic'
import type { EditorProps } from '../editor'

const Editor = dynamic<EditorProps>(() =>
  import('../editor').then((mod) => mod.Editor)
)

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (context.req.method !== 'POST') {
    return {
      props: {
        state: migrate({
          version: 0,
          document: kitchenSink,
        }),
        ltik: '',
        mayEdit: true,
      },
    }
  }

  const props = await getJsonBody<PageProps>(context)
  const response = await fetch('http://localhost:3000/lti/get-content', {
    headers: {
      Authorization: `Bearer ${props.ltik}`,
    },
  })
  const state = await response.json()

  return {
    props: {
      ...props,
      state: migrate(state),
    },
  }
}

export interface PageProps extends EditorProps {
  mayEdit: boolean
}

export default function Page(props: PageProps) {
  if (props.mayEdit) {
    return <Editor {...props} />
  } else {
    return (
      <Layout>
        <Renderer plugins={plugins} state={props.state.document} />
      </Layout>
    )
  }
}
