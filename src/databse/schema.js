import {appSchema, tableSchema} from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'surveys',
      columns: [
        {name: 'teacher_id', type: 'string'},
        {name: 'teacher_name', type: 'string'},
        {name: 'questions_json', type: 'string'},
        {name: 'latitude', type: 'number'},
        {name: 'longitude', type: 'number'},
        {name: 'district', type: 'string'},
        {name: 'block', type: 'string'},
        {name: 'cluster', type: 'string'},
        {name: 'area', type: 'string'},
      ],
    }),
  ],
});
