import {appSchema, tableSchema} from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'surveys',
      columns: [
        {name: 'name', type: 'string'},
        {name: 'status', type: 'string'},
      ],
    }),
  ],
});
