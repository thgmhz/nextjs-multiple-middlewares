import { NextRequest, NextResponse } from 'next/server';

import { log } from '../log';

export interface MiddlewareRunner {
  (request: NextRequest, response: NextResponse):
    | NextResponse
    | Promise<NextResponse>;
}

export interface MiddlewareFallback {
  (request: NextRequest, response: NextResponse):
    | NextResponse
    | Promise<NextResponse>;
}

export interface Middleware {
  /**
   * The `name` property serves for debugging purposes and also used to report errors.
   *
   * @required
   */
  name: string;

  /**
   * Used to determine whether the middleware should be applied based on the URL.
   *
   * When the value is an array of strings, the matcher validate if some value is present in the NextURL `pathname` or `searchParams`.
   *
   * When the value is a RegExp, the matcher validate if some value tests true for NextURL `href`.
   *
   * @required
   */
  matcher: (string | RegExp)[];

  /**
   * The `fallback` middleware async function that will be applied when the `run` function rejects the promise or throws an error. This is useful when you need to handle errors in a specific way.
   *
   * @optional
   */
  fallback?: MiddlewareFallback;

  /**
   * The middleware async function that will be applied based on the `matcher` param. This is where you can apply the middleware logic.
   *
   * @required
   */
  run: MiddlewareRunner;
}

interface CreateMiddleware {
  (middleware: Middleware): Middleware;
}

const isProduction = process.env.NODE_ENV === 'production';

export const createMiddleware: CreateMiddleware = (middleware) => {
  const safeMiddleware = Object.assign({}, middleware);

  if (middleware.fallback) {
    safeMiddleware.fallback = async (request, response) => {
      try {
        log.info(
          `${middleware.name} fallback is executing: ${request.nextUrl.href}`
        );

        const res = await middleware.fallback!(request, response);

        log.info(`${middleware.name} fallback executed successfully!`);

        return res;
      } catch (error) {
        log.error(`${middleware} has an error on fallback`);

        if (isProduction) {
          // TODO: Reportar erro de "middleware fallback" para o Sentry
        }

        throw error;
      }
    };
  }

  safeMiddleware.run = async (request, response) => {
    try {
      const res = await middleware.run(request, response);

      return res;
    } catch (error) {
      log.error(`${error}`);

      if (isProduction) {
        // TODO: Reportar erro de "middleware" para o Sentry
      }

      if (safeMiddleware.fallback) {
        return await safeMiddleware.fallback(request, response);
      } else {
        log.warn(
          `${middleware.name} encountered an error but has no "fallback" set, make sure this is the desired behavior.`
        );
      }

      throw error;
    }
  };

  return safeMiddleware;
};
