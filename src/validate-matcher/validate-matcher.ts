import type { Middleware } from '../create-middleware';

interface RequestURL {
  pathname: string;
  search: string;
  href: string;
}

interface MatchParams extends RequestURL {
  value: string | RegExp;
}

interface HasMatch {
  (params: MatchParams): boolean;
}

interface MatcherParams extends RequestURL {
  matcher: Middleware['matcher'];
}

interface ValidateMatcher {
  (params: MatcherParams): boolean;
}

const hasMatch: HasMatch = ({ value, pathname, search, href }) => {
  if (value instanceof RegExp) {
    return value.test(href);
  }

  return pathname.includes(value) || search.includes(value);
};

export const validateMatcher: ValidateMatcher = ({ matcher, ...urlParams }) =>
  matcher.some((value) => hasMatch({ value, ...urlParams }));
