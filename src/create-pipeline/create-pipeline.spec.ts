import { NextRequest, NextResponse } from 'next/server';
import { createPipeline } from './create-pipeline';

const mockMiddleware1 = {
  name: 'some-middleware-1',
  matcher: ['/some-path'],
  run: jest.fn(),
};

const mockMiddleware2 = {
  name: 'some-middleware-2',
  matcher: ['some-query=value'],
  run: jest.fn(),
};

const mockRequest = new NextRequest(
  new Request('http://some-url.com/some-path?some-query=value')
);

describe('Middlewares - createPipeline', () => {
  it('must receive a NextRequest param and return an object with correct pipeline params', () => {
    const pipeline = createPipeline(mockRequest);

    expect(pipeline).toHaveProperty('pipe');
    expect(pipeline.pipe).toBeInstanceOf(Function);
  });

  it('must receive an array of middlewares and return a NextResponse', async () => {
    const pipeline = createPipeline(mockRequest);

    pipeline.pipe = jest.fn().mockResolvedValue(NextResponse.next());

    const stackSpy = jest.spyOn(pipeline, 'pipe');

    const response = await pipeline.pipe(mockMiddleware1, mockMiddleware2);

    expect(stackSpy).toHaveBeenCalledTimes(1);
    expect(stackSpy).toHaveBeenCalledWith(mockMiddleware1, mockMiddleware2);

    expect(response).toBeInstanceOf(NextResponse);
  });

  it('must not execute any middleware when no one matches the URL', async () => {
    const pipeline = createPipeline(mockRequest);

    const run1Spy = jest.spyOn(mockMiddleware1, 'run');
    const run2Spy = jest.spyOn(mockMiddleware2, 'run');

    mockMiddleware1.matcher = ['/some-other-path'];
    mockMiddleware2.matcher = ['some-other-query'];

    const response = await pipeline.pipe(mockMiddleware1, mockMiddleware2);

    expect(run1Spy).not.toHaveBeenCalled();
    expect(run2Spy).not.toHaveBeenCalled();

    expect(response).toBeInstanceOf(NextResponse);
  });

  it('must break the pipe when the first middleware redirects', async () => {
    const pipeline = createPipeline(mockRequest);

    const responseRedirect = NextResponse.redirect(
      new URL('http://www.test.com')
    );

    mockMiddleware1.matcher = ['/some-path'];
    mockMiddleware2.matcher = ['some-query'];

    const run2Spy = jest.spyOn(mockMiddleware2, 'run');

    mockMiddleware1.run.mockResolvedValue(responseRedirect);

    const response = await pipeline.pipe(mockMiddleware1, mockMiddleware2);

    expect(response.status).toBe(307);
    expect(run2Spy).not.toHaveBeenCalled();
  });

  it('must return response redirect when some middleware redirects', async () => {
    const pipeline = createPipeline(mockRequest);

    const responseRedirect = NextResponse.redirect(
      new URL('http://www.test.com')
    );

    mockMiddleware1.matcher = ['/some-path'];
    mockMiddleware2.matcher = ['some-query'];

    mockMiddleware1.run.mockResolvedValue(responseRedirect);

    const response = await pipeline.pipe(mockMiddleware1, mockMiddleware2);

    expect(response.status).toBe(307);
  });
});
