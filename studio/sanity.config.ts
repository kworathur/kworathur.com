import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { codeInput } from '@sanity/code-input';
import { schemaTypes } from './schemaTypes';

const singletonTypes = new Set(['now']);

export default defineConfig({
  name: 'default',
  title: 'kworathur.com',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Now page')
              .id('now')
              .child(S.document().schemaType('now').documentId('now')),
            S.divider(),
            S.documentTypeListItem('post').title('Posts'),
          ]),
    }),
    codeInput(),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    actions: (input, { schemaType }) =>
      singletonTypes.has(schemaType)
        ? input.filter(
            ({ action }) =>
              action && action !== 'delete' && action !== 'duplicate'
          )
        : input,
  },
});
