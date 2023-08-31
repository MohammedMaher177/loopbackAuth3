

// Copyright IBM Corp. and LoopBack contributors 2019. All Rights Reserved.
// Node module: @loopback/authentication
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {AuthenticationBindings, UserProfileFactory, UserService} from '@loopback/authentication';
import {BindingKey, inject} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {User} from '../models';
import {UserRepository} from '../repositories';
import {BasicAuthenticationStrategyCredentials} from '../strategies/basic-strategy';

import {UserProfile} from "@loopback/security"

export const USER_REPO = BindingKey.create<UserRepository>(
  'authentication.user.repo',
);

export class BasicAuthenticationUserService
  implements UserService<User, BasicAuthenticationStrategyCredentials>
{
  constructor(
    @inject(USER_REPO)
    private userRepository: UserRepository,
    @inject(AuthenticationBindings.USER_PROFILE_FACTORY)
    public userProfileFactory: UserProfileFactory<User>,
  ) { }

  async verifyCredentials(
    credentials: BasicAuthenticationStrategyCredentials,
  ): Promise<User> {
    if (!credentials) {
      throw new HttpErrors.Unauthorized(`'credentials' is null`);
    }

    if (!credentials.email) {
      throw new HttpErrors.Unauthorized(`'credentials.email' is null`);
    }

    if (!credentials.password) {
      throw new HttpErrors.Unauthorized(`'credentials.password' is null`);
    }

    const foundUser = this.userRepository.findByEmail(credentials.email);
    if (!foundUser) {
      throw new HttpErrors['Unauthorized'](
        `User with email ${credentials.email} not found.`,
      );
    }

    if (credentials.password !== foundUser.password) {
      throw new HttpErrors.Unauthorized('The password is not correct.');
    }

    return foundUser;
  }

  convertToUserProfile(user: User): UserProfile {
    if (!user) {
      throw new HttpErrors.Unauthorized(`'user' is null`);
    }

    if (!user.id) {
      throw new HttpErrors.Unauthorized(`'user id' is null`);
    }

    return this.userProfileFactory(user);
  }
}
