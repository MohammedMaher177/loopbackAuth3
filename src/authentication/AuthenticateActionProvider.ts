import {AuthenticateFn, AuthenticationBindings, AuthenticationStrategy, USER_PROFILE_NOT_FOUND} from '@loopback/authentication';
import {Getter, Provider, Setter, inject} from '@loopback/core';
import {RedirectRoute, Request, RequestContext, RestBindings} from '@loopback/rest';

import {SecurityBindings, UserProfile} from "@loopback/security";

export class AuthenticateActionProvider implements Provider<AuthenticateFn> {
  constructor(
    // The provider is instantiated for Sequence constructor,
    // at which time we don't have information about the current
    // route yet. This information is needed to determine
    // what auth strategy should be used.
    // To solve this, we are injecting a getter function that will
    // defer resolution of the strategy until authenticate() action
    // is executed.
    @inject(RestBindings.Http.CONTEXT)
    private requestContext: RequestContext,
    @inject.getter(AuthenticationBindings.STRATEGY)
    readonly getStrategy: Getter<AuthenticationStrategy>,
    @inject.setter(SecurityBindings.USER)
    readonly setCurrentUser: Setter<UserProfile>,
  ) { }

  /**
   * @returns authenticateFn
   */
  value(): AuthenticateFn {
    return request => this.action(request);
  }

  /**
   * The implementation of authenticate() sequence action.
   * @param request The incoming request provided by the REST layer
   */
  async action(request: Request): Promise<UserProfile | undefined> {
    const strategy = await this.getStrategy();
    if (!strategy) {
      // The invoked operation does not require authentication.
      return undefined;
    }

    let authResponse: UserProfile| RedirectRoute | undefined = undefined;

    authResponse = await strategy.authenticate(request);
    // const userProfile = await strategy.authenticate(request);
    const userProfile = authResponse as unknown as UserProfile;

    if (!userProfile) {
      // important to throw a non-protocol-specific error here
      const error = new Error(
        `User profile not returned from strategy's authenticate function`,
      );
      Object.assign(error, {
        code: USER_PROFILE_NOT_FOUND,
      });
      throw error;
    }

    // this.setCurrentUser(userProfile);
    // return userProfile;
    this.setCurrentUser(userProfile);
    return userProfile;
  }
}
