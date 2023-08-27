import type { Middleware } from '../create-middleware';
import { validateMatcher } from './validate-matcher';

const mockMatcher = (matcher: Middleware['matcher']) => ({
  matcher,
  pathname: '/some-path',
  search: '?some=search',
  href: 'http://some-url.com/some-path?some=search',
});

describe('Middlewares - validateMatcher', () => {
  it('must return true if the values are strings and "pathname" contains some value', () => {
    expect(
      validateMatcher(mockMatcher(['foo', 'bar', 'me-path']))
    ).toStrictEqual(true);

    expect(
      validateMatcher(mockMatcher(['foo', 'bar', '/some-path']))
    ).toStrictEqual(true);
  });

  it('must return true if the values are strings and "search" contains some value', () => {
    expect(validateMatcher(mockMatcher(['foo', 'bar', '?som']))).toStrictEqual(
      true
    );

    expect(
      validateMatcher(mockMatcher(['foo', 'bar', '?some=search']))
    ).toStrictEqual(true);
  });

  it('must return false if the values are strings and "pathname" contains no value', () => {
    expect(validateMatcher(mockMatcher(['foo', 'bar']))).toStrictEqual(false);
  });

  it('must return false if the values are strings and "search" contains no value', () => {
    expect(validateMatcher(mockMatcher(['foo', 'bar']))).toStrictEqual(false);
  });

  it('must return true if the values are RegExp and some value test true for "href" param', () => {
    expect(
      validateMatcher(mockMatcher([/\.com\/fake-path/, /\.com\/some/]))
    ).toStrictEqual(true);
  });

  it('must return false if the values are RegExp and no value test true for "href" param', () => {
    expect(
      validateMatcher(
        mockMatcher([/\.com\/fake-path/, /\.com\/another-fake-path/])
      )
    ).toStrictEqual(false);
  });
});
