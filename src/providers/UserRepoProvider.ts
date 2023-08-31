

import {Provider} from '@loopback/context';
import {inject} from '@loopback/core';
import {RequestContext, RestBindings} from '@loopback/rest';
import {UserRepository} from '../repositories';



export class UserRepoProvider implements Provider<UserRepository> {
  constructor(
    @inject(RestBindings.Http.CONTEXT)
    private requestContext: RequestContext,
  ) { }

  value(): UserRepository {
    // Access the repository instance from the request context
    return this.requestContext.getSync('authentication.user.repo');
  }
}
