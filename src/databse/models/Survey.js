import {Model} from '@nozbe/watermelondb';
import {field} from '@nozbe/watermelondb/decorators';

export default class Survey extends Model {
  static table = 'surveys';

  @field('name') name;
  @field('status') status;
}
