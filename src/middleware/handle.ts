import {AUTHENTICATION_STRATEGY_NOT_FOUND, AuthenticateFn, AuthenticationBindings, USER_PROFILE_NOT_FOUND} from '@loopback/authentication';
import {config, inject} from '@loopback/core';
import {FindRoute, InvokeMethod, InvokeMiddleware, InvokeMiddlewareOptions, ParseParams, Reject, RequestContext, Send, SequenceActions, SequenceHandler} from '@loopback/rest';
import {debug} from 'console';


export class MiddlewareSequence implements SequenceHandler {
  static defaultOptions: InvokeMiddlewareOptions = {
    chain: 'middlewareChain.rest',
    orderedGroups: [
      // Please note that middleware is cascading. The `sendResponse` is
      // added first to invoke downstream middleware to get the result or
      // catch errors so that it can produce the http response.
      'sendResponse',

      // default
      'cors',
      'apiSpec',

      // default
      'middleware',

      // rest
      'findRoute',

      // authentication
      'authentication',

      // rest
      'parseParams',
      'invokeMethod',
    ],
  };

  /**
   * Constructor: Injects `InvokeMiddleware` and `InvokeMiddlewareOptions`
   *
   * @param invokeMiddleware - invoker for registered middleware in a chain.
   * To be injected via SequenceActions.INVOKE_MIDDLEWARE.
   */
  constructor(
    @inject(SequenceActions.INVOKE_MIDDLEWARE)
    readonly invokeMiddleware: InvokeMiddleware,
    @config()
    readonly options: InvokeMiddlewareOptions = MiddlewareSequence.defaultOptions,
  ) { }

  /**
   * Runs the default sequence. Given a handler context (request and response),
   * running the sequence will produce a response or an error.
   *
   * @param context - The request context: HTTP request and response objects,
   * per-request IoC container and more.
   */
  async handle(context: RequestContext): Promise<void> {
    debug(
      'Invoking middleware chain %s with groups %s',
      this.options.chain,
      this.options.orderedGroups,
    );
    await this.invokeMiddleware(context, this.options);
  }
}


export class MyAuthenticatingSequence implements SequenceHandler {
  constructor(
    // ... Other injections
    @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(SequenceActions.PARSE_PARAMS)
    protected parseParams: ParseParams,
    @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(SequenceActions.SEND) protected send: Send,
    @inject(SequenceActions.REJECT) protected reject: Reject,
    // ------ ADD SNIPPET ---------
    @inject(AuthenticationBindings.AUTH_ACTION)
    protected authenticateRequest: AuthenticateFn, // ------------- END OF SNIPPET -------------
  ) { }

  async handle(context: RequestContext) {
    try {
      const {request, response} = context;
      const route = this.findRoute(request);

      // ------ ADD SNIPPET ---------
      //call authentication action
      await this.authenticateRequest(request);
      // ------------- END OF SNIPPET -------------

      // Authentication successful, proceed to invoke controller
      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);
      this.send(response, result);
    } catch (error) {
      // ------ ADD SNIPPET ---------
      if (
        error.code === AUTHENTICATION_STRATEGY_NOT_FOUND ||
        error.code === USER_PROFILE_NOT_FOUND
      ) {
        Object.assign(error, {statusCode: 401 /* Unauthorized */});
      }
      // ------------- END OF SNIPPET -------------

      this.reject(context, error);
      return;
    }
  }
}
