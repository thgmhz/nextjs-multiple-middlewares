import { NextRequest, NextResponse } from 'next/server';
import { createMiddleware } from './create-middleware';

const mockMiddleware = {
  name: 'some-middleware',
  matcher: ['some-path'],
  run: jest.fn(),
};

const mockRequest = new NextRequest(
  new Request('http://some-url.com/some-path')
);

const mockResponse = NextResponse.next();

describe('Middlewares - createMiddleware', () => {
  it('must return the correct middleware object', () => {
    const middleware = createMiddleware(mockMiddleware);

    expect(middleware.name).toStrictEqual(mockMiddleware.name);
    expect(middleware.matcher).toStrictEqual(mockMiddleware.matcher);
    expect(middleware.run).toBeInstanceOf(Function);
  });

  it('must execute middleware run passing NextRequest and NextResponse params', async () => {
    const middleware = createMiddleware(mockMiddleware);

    const run = jest.spyOn(middleware, 'run');

    await middleware.run(mockRequest, mockResponse);

    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(mockRequest, mockResponse);
  });

  it('must return an NextResponse when middleware "run" with success', async () => {
    mockMiddleware.run.mockResolvedValue(NextResponse.next());

    const middleware = createMiddleware(mockMiddleware);

    const response = await middleware.run(mockRequest, mockResponse);

    expect(response).toBeInstanceOf(NextResponse);
  });

  it('must throw an error when middleware "run" throw an error and has no "fallback" defined', async () => {
    mockMiddleware.run.mockRejectedValue(new Error());

    const middleware = createMiddleware(mockMiddleware);

    await expect(
      middleware.run(mockRequest, mockResponse)
    ).rejects.toBeInstanceOf(Error);
  });

  it('must throw an error when middleware "run" rejects and has no "fallback" defined', async () => {
    mockMiddleware.run.mockRejectedValue('some-reject');

    const middleware = createMiddleware(mockMiddleware);

    await expect(middleware.run(mockRequest, mockResponse)).rejects.toBe(
      'some-reject'
    );
  });

  it('must execute "fallback" when "run" throw an error and the middleware has "fallback" defined', async () => {
    mockMiddleware.run.mockRejectedValue(new Error());

    // @ts-ignore
    mockMiddleware.fallback = jest.fn().mockResolvedValue(NextResponse.next());

    const middleware = createMiddleware(mockMiddleware);

    const fallbackSpy = jest.spyOn(middleware, 'fallback');

    const response = await middleware.run(mockRequest, mockResponse);

    expect(fallbackSpy).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(NextResponse);
  });

  it('must throw an error when "run" throw an error and "fallback" throw an error', async () => {
    mockMiddleware.run.mockRejectedValue(new Error());

    // @ts-ignore
    mockMiddleware.fallback = jest.fn().mockRejectedValue(new Error());

    const middleware = createMiddleware(mockMiddleware);

    await expect(
      middleware.run(mockRequest, mockResponse)
    ).rejects.toBeInstanceOf(Error);

    await expect(jest.spyOn(middleware, 'fallback')).rejects.toBeInstanceOf(
      Error
    );
  });
});
