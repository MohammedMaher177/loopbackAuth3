import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import {MongoDataSource} from '../datasources';
import {User, UserRelations} from '../models';





export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype._id,
  UserRelations
> {
  constructor(
    readonly list: {[key: string]: User},
    @inject('datasources.mongo') dataSource: MongoDataSource,
  ) {
    super(User, dataSource);
  }

  findByEmail(email: string): User | undefined {
    const found = Object.keys(this.list).find(
      k => this.list[k].email === email,
    );
    return found ? this.list[found] : undefined;
  }



}
