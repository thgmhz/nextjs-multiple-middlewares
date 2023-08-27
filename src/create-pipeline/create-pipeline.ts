import { NextRequest, NextResponse } from 'next/server';

import type { Middleware } from '../create-middleware';

import { validateMatcher } from '../validate-matcher';

import { log } from '../log';

interface Pipe {
  (...middlewares: Middleware[]): Promise<NextResponse>;
}

interface CreatePipeline {
  (request: NextRequest): {
    pipe: Pipe;
  };
}

export const createPipeline: CreatePipeline = (request) => {
  const pipe = async (...middlewares: Middleware[]) => {
    let response = NextResponse.next();

    const { pathname, search, href } = request.nextUrl;

    for await (const middleware of middlewares) {
      const hasMatch = validateMatcher({
        matcher: middleware.matcher,
        pathname,
        search,
        href,
      });

      if (hasMatch) {
        log.info(
          `${middleware.name} is running for: ${log.colors.cyan(
            request.nextUrl.href
          )}`
        );

        response = await middleware.run(request, response);

        const mustRedirect = response.status >= 300 && response.status <= 399;

        if (mustRedirect) {
          log.info(
            `${
              middleware.name
            } has finished executing and is redirecting to: ${log.colors.cyanBright(
              request.nextUrl.href
            )}\n`
          );
          break;
        }

        log.info(`${middleware.name} has finished executing\n`);
      }
    }

    return response;
  };

  return { pipe };
};
