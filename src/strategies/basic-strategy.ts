import {AuthenticationBindings, AuthenticationMetadata, AuthenticationStrategy, asAuthStrategy} from '@loopback/authentication';
import {BindingKey, Getter, inject, injectable} from '@loopback/core';
import {HttpErrors, OASEnhancer, OpenApiSpec, Request, asSpecEnhancer, mergeSecuritySchemeToSpec} from '@loopback/rest';

import {UserProfile} from "@loopback/security";
import {BasicAuthenticationUserService} from '../services/basic-auth-user-service';

export interface BasicAuthenticationStrategyCredentials {
  email: string;
  password: string;
}
export interface AuthenticationStrategyOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [property: string]: any;
}
export namespace BasicAuthenticationStrategyBindings {
  export const USER_SERVICE = BindingKey.create<BasicAuthenticationUserService>(
    'services.authentication.basic.user.service',
  );

  export const DEFAULT_OPTIONS =
    BindingKey.create<AuthenticationStrategyOptions>(
      'authentication.strategies.basic.defaultoptions',
    );
}



@injectable(asAuthStrategy, asSpecEnhancer)
export class BasicAuthenticationStrategy
  implements AuthenticationStrategy, OASEnhancer {
  name = 'basic';
  @inject(BasicAuthenticationStrategyBindings.DEFAULT_OPTIONS)
  options: AuthenticationStrategyOptions;
  constructor(
    @inject(BasicAuthenticationStrategyBindings.USER_SERVICE)
    private userService: BasicAuthenticationUserService,
    @inject.getter(AuthenticationBindings.METADATA)
    readonly getMetaData: Getter<AuthenticationMetadata>,
  ) { }

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const credentials: BasicAuthenticationStrategyCredentials =
      this.extractCredentials(request);

      await this.processOptions();

    if (this.options.gatherStatistics === true) {
      console.log(`\nGathering statistics...\n`);
    } else {
      console.log(`\nNot gathering statistics...\n`);
    }


    const user = await this.userService.verifyCredentials(credentials);
    const userProfile = this.userService.convertToUserProfile(user);

    return userProfile;
  }

  extractCredentials(request: Request): BasicAuthenticationStrategyCredentials {
    if (!request.headers.authorization) {
      throw new HttpErrors.Unauthorized(`Authorization header not found.`);
    }

    // for example : Basic Z2l6bW9AZ21haWwuY29tOnBhc3N3b3Jk
    const authHeaderValue = request.headers.authorization;

    if (!authHeaderValue.startsWith('Basic')) {
      throw new HttpErrors.Unauthorized(
        `Authorization header is not of type 'Basic'.`,
      );
    }

    //split the string into 2 parts. We are interested in the base64 portion
    const parts = authHeaderValue.split(' ');
    if (parts.length !== 2)
      throw new HttpErrors.Unauthorized(
        `Authorization header value has too many parts. It must follow the pattern: 'Basic xxyyzz' where xxyyzz is a base64 string.`,
      );
    const encryptedCredentails = parts[1];

    // decrypt the credentials. Should look like :   'email:password'
    const decryptedCredentails = Buffer.from(
      encryptedCredentails,
      'base64',
    ).toString('utf8');

    //split the string into 2 parts
    const decryptedParts = decryptedCredentails.split(':');

    if (decryptedParts.length !== 2) {
      throw new HttpErrors.Unauthorized(
        `Authorization header 'Basic' value does not contain two parts separated by ':'.`,
      );
    }

    const creds: BasicAuthenticationStrategyCredentials = {
      email: decryptedParts[0],
      password: decryptedParts[1],
    };

    return creds;
  }

  async processOptions() {
    /**
        Obtain the options object specified in the @authenticate decorator
        of a controller method associated with the current request.
        The AuthenticationMetadata interface contains : strategy:string, options?:object
        We want the options property.
    */
    const controllerMethodAuthenticationMetadata = await this.getMetaData();

    if (!this.options) this.options = {}; //if no default options were bound, assign empty options object

    //override default options with request-level options
    this.options = Object.assign(
      {},
      this.options,
      controllerMethodAuthenticationMetadata.options,
    );
  }

  modifySpec(spec: OpenApiSpec): OpenApiSpec {
    return mergeSecuritySchemeToSpec(spec, this.name, {
      type: 'http',
      scheme: 'basic',
    });
  }
}
