import {Model} from '@nozbe/watermelondb';
import {field} from '@nozbe/watermelondb/decorators';

export default class Survey extends Model {
  static table = 'surveys';

  @field('teacher_id') teacherId;
  @field('teacher_name') teacherName;
  @field('questions_json') questionsJson;
  @field('latitude') latitude;
  @field('longitude') longitude;
  @field('district') district;
  @field('block') block;
  @field('cluster') cluster;
  @field('area') area;
}
