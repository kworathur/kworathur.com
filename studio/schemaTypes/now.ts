import { defineField, defineType } from 'sanity';

export const now = defineType({
  name: 'now',
  title: 'Now page',
  type: 'document',
  fields: [defineField({ name: 'body', type: 'blockContent' })],
  preview: {
    prepare: () => ({ title: 'Now page' }),
  },
});
