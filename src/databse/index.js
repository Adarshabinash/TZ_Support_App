import {Database} from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import {schema} from './schema';
import Survey from './models/Survey';

const adapter = new SQLiteAdapter({
  dbName: 'MasterQuiz',
  schema,
  jsi: true,
  // migrations,
  onSetUpError: error => {
    console.log(error);
  },
});

const database = new Database({
  adapter,
  modelClasses: [Survey],
});

export {database};
