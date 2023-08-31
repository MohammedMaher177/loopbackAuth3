import {AuthenticationBindings, registerAuthenticationStrategy} from '@loopback/authentication';
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';

import {AuthenticationComponent} from '@loopback/authentication';
import path from 'path';
import {MyAuthenticatingSequence} from './middleware/handle';
import {MySequence} from './sequence';
import {BasicAuthenticationUserService} from './services/basic-auth-user-service';
import {BasicAuthenticationStrategy, BasicAuthenticationStrategyBindings} from './strategies/basic-strategy';
import {UserRepoProvider} from './providers/UserRepoProvider';

export {ApplicationConfig};




export class Auth2Application extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);
    this.bind(AuthenticationBindings.USER_REPO).toProvider(UserRepoProvider);
    this.component(RestExplorerComponent);
    this.component(AuthenticationComponent);

    registerAuthenticationStrategy(this, BasicAuthenticationStrategy);

    this.sequence(MyAuthenticatingSequence);

    this.bind(BasicAuthenticationStrategyBindings.DEFAULT_OPTIONS).to({
      gatherStatistics: true,
    });




    this.configure(AuthenticationBindings.COMPONENT)
      .to({defaultMetadata: [{strategy: 'basic'}]})
      .to({failOnError: true});


    this.bind('services.authentication.basic.user.service').toClass(
      BasicAuthenticationUserService,
    );


    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });


    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };





  }
}
