/* @flow */
import tape from 'tape-cup';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {createPlugin} from '../create-plugin';
import {createToken} from '../create-token';
import type {FusionPlugin, Token} from '../types.js';
import {throwsAsync, doesNotThrowAsync} from './test-helper.js';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();
type AType = {
  a: string,
};
type BType = {
  b: string,
};
type CType = {
  c: string,
};
type EType = {
  e: string,
};
const TokenA: Token<AType> = createToken('TokenA');
const TokenB: Token<BType> = createToken('TokenB');
const TokenC: Token<CType> = createToken('TokenC');
const TokenD: Token<BType> = createToken('TokenD');
const TokenEAsNullable: Token<?EType> = createToken('TokenEAsNullable');
const TokenString: Token<string> = createToken('TokenString');
const TokenNumber: Token<number> = createToken('TokenNumber');

tape('dependency registration', async t => {
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };

  const PluginA: FusionPlugin<void, AType> = createPlugin({
    provides: () => {
      counters.a++;
      t.equal(counters.a, 1, 'only instantiates once');
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB: FusionPlugin<{a: Token<AType>}, BType> = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: deps => {
      counters.b++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(counters.b, 1, 'only instantiates once');
      return {
        b: 'PluginB',
      };
    },
  });

  type PluginCType = FusionPlugin<{a: Token<AType>, b: Token<BType>}, CType>;
  const PluginC: PluginCType = createPlugin({
    deps: {
      a: TokenA,
      b: TokenB,
    },
    provides: deps => {
      counters.c++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(deps.b.b, 'PluginB');
      t.equal(counters.c, 1, 'only instantiates once');
      return {
        c: 'PluginC',
      };
    },
  });

  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC);
  app.register(
    createPlugin({
      deps: {a: TokenA, b: TokenB, c: TokenC},
      provides: deps => {
        counters.d++;
        t.equal(deps.a.a, 'PluginA');
        t.equal(deps.b.b, 'PluginB');
        t.equal(deps.c.c, 'PluginC');
      },
    })
  );
  t.equal(counters.a, 0, 'does not instantiate until resolve is called');
  t.equal(counters.b, 0, 'does not instantiate until resolve is called');
  t.equal(counters.c, 0, 'does not instantiate until resolve is called');
  t.equal(counters.d, 0, 'does not instantiate until resolve is called');
  await app.resolve();
  t.equal(counters.a, 1, 'only instantiates once');
  t.equal(counters.b, 1, 'only instantiates once');
  t.equal(counters.c, 1, 'only instantiates once');
  t.equal(counters.d, 1, 'only instantiates once');
  t.end();
});

tape('dependency registration with aliases', async t => {
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };

  const PluginA: FusionPlugin<void, AType> = createPlugin({
    provides: () => {
      counters.a++;
      t.equal(counters.a, 1, 'only instantiates once');
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB: FusionPlugin<{a: Token<AType>}, BType> = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: deps => {
      counters.b++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(counters.b, 1, 'only instantiates once');
      return {
        b: 'PluginB',
      };
    },
  });

  type PluginCType = FusionPlugin<{a: Token<AType>, b: Token<BType>}, CType>;
  const PluginC: PluginCType = createPlugin({
    deps: {
      a: TokenA,
      b: TokenB,
    },
    provides: deps => {
      counters.c++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(deps.b.b, 'PluginD', 'uses correct alias');
      t.equal(counters.c, 1, 'only instantiates once');
      return {
        c: 'PluginC',
      };
    },
  });

  const PluginD: FusionPlugin<{a: Token<AType>}, BType> = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: deps => {
      counters.d++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(counters.d, 1, 'only instantiates once');
      return {
        b: 'PluginD',
      };
    },
  });

  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC).alias(TokenB, TokenD);
  app.register(TokenD, PluginD);
  t.equal(counters.a, 0, 'does not instantiate until resolve is called');
  t.equal(counters.b, 0, 'does not instantiate until resolve is called');
  t.equal(counters.c, 0, 'does not instantiate until resolve is called');
  t.equal(counters.d, 0, 'does not instantiate until resolve is called');
  await app.resolve();
  t.equal(counters.a, 1, 'only instantiates once');
  t.equal(counters.b, 1, 'only instantiates once');
  t.equal(counters.c, 1, 'only instantiates once');
  t.equal(counters.d, 1, 'only instantiates once');
  t.end();
});

tape('optional dependency registration with aliases', async t => {
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };

  const PluginA: FusionPlugin<void, AType> = createPlugin({
    provides: () => {
      counters.a++;
      t.equal(counters.a, 1, 'only instantiates once');
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB: FusionPlugin<{a: Token<AType>}, BType> = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: deps => {
      counters.b++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(counters.b, 1, 'only instantiates once');
      return {
        b: 'PluginB',
      };
    },
  });

  type PluginCType = FusionPlugin<
    {a: typeof TokenA, b: typeof TokenB.optional},
    CType
  >;
  const PluginC: PluginCType = createPlugin({
    deps: {
      a: TokenA,
      b: TokenB.optional,
    },
    provides: deps => {
      counters.c++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(deps.b && deps.b.b, 'PluginD', 'uses correct alias');
      t.equal(counters.c, 1, 'only instantiates once');
      return {
        c: 'PluginC',
      };
    },
  });

  const PluginD: FusionPlugin<{a: Token<AType>}, BType> = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: deps => {
      counters.d++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(counters.d, 1, 'only instantiates once');
      return {
        b: 'PluginD',
      };
    },
  });

  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC).alias(TokenB, TokenD);
  app.register(TokenD, PluginD);
  t.equal(counters.a, 0, 'does not instantiate until resolve is called');
  t.equal(counters.b, 0, 'does not instantiate until resolve is called');
  t.equal(counters.c, 0, 'does not instantiate until resolve is called');
  t.equal(counters.d, 0, 'does not instantiate until resolve is called');
  await app.resolve();
  t.equal(counters.a, 1, 'only instantiates once');
  t.equal(counters.b, 1, 'only instantiates once');
  t.equal(counters.c, 1, 'only instantiates once');
  t.equal(counters.d, 1, 'only instantiates once');
  t.end();
});

tape('dependency registration with aliasing non-plugins', async t => {
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };

  const ValueA = 'some-value';
  const AliasedValue = 'some-aliased-value';
  const ValueTokenA: Token<string> = createToken('ValueA');
  const AliasedTokenA: Token<string> = createToken('AliasedTokenA');
  const PluginB: FusionPlugin<{a: Token<string>}, BType> = createPlugin({
    deps: {
      a: ValueTokenA,
    },
    provides: deps => {
      counters.b++;
      t.equal(deps.a, 'some-value');
      t.equal(counters.b, 1, 'only instantiates once');
      return {
        b: 'PluginB',
      };
    },
  });

  type PluginCType = FusionPlugin<{a: Token<string>}, CType>;
  const PluginC: PluginCType = createPlugin({
    deps: {
      a: ValueTokenA,
    },
    provides: deps => {
      counters.c++;
      t.equal(deps.a, 'some-aliased-value');
      t.equal(counters.c, 1, 'only instantiates once');
      return {
        c: 'PluginC',
      };
    },
  });

  app.register(ValueTokenA, ValueA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC).alias(ValueTokenA, AliasedTokenA);
  app.register(AliasedTokenA, AliasedValue);
  t.equal(counters.b, 0, 'does not instantiate until resolve is called');
  t.equal(counters.c, 0, 'does not instantiate until resolve is called');
  await app.resolve();
  t.equal(counters.b, 1, 'only instantiates once');
  t.equal(counters.c, 1, 'only instantiates once');
  t.end();
});

tape('dependency registration with no token', async t => {
  const app = new App('el', el => el);
  const PluginA: FusionPlugin<void, AType> = createPlugin({
    provides: () => {
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB: FusionPlugin<{a: Token<AType>}, BType> = createPlugin({
    deps: {
      a: TokenA,
    },
    provides: deps => {
      t.equal(deps.a.a, 'PluginA');
      return {
        b: 'PluginB',
      };
    },
  });

  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(
    createPlugin({
      deps: {a: TokenA, b: TokenB},
      provides: deps => {
        t.equal(deps.a.a, 'PluginA');
        t.equal(deps.b.b, 'PluginB');
      },
    })
  );
  await app.resolve();
  t.end();
});

tape('dependency registration with middleware', async t => {
  const counters = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  };
  const app = new App('el', el => el);
  t.ok(app, 'creates an app');
  const PluginA = createPlugin({
    provides: () => {
      counters.a++;
      t.equal(counters.a, 1, 'only instantiates once');
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB = createPlugin({
    deps: {a: TokenA},
    provides: deps => {
      counters.b++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(counters.b, 1, 'only instantiates once');
      return {
        b: 'PluginB',
      };
    },
  });
  const PluginC = createPlugin({
    deps: {a: TokenA, b: TokenB},
    provides: deps => {
      counters.c++;
      t.equal(deps.a.a, 'PluginA');
      t.equal(deps.b.b, 'PluginB');
      t.equal(counters.c, 1, 'only instantiates once');
      return {
        c: 'PluginC',
      };
    },
    middleware: () => (ctx, next) => next(),
  });
  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC);
  t.equal(counters.a, 0, 'does not instantiate until resolve is called');
  t.equal(counters.b, 0, 'does not instantiate until resolve is called');
  t.equal(counters.c, 0, 'does not instantiate until resolve is called');
  await app.resolve();
  t.equal(counters.a, 1, 'only instantiates once');
  t.equal(counters.b, 1, 'only instantiates once');
  t.equal(counters.c, 1, 'only instantiates once');
  t.end();
});

tape('dependency registration with missing dependency', async t => {
  const app = new App('el', el => el);
  const PluginA = createPlugin({
    provides: () => {
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginC = createPlugin({
    deps: {a: TokenA, b: TokenB},
    provides: () => {
      return {
        c: 'PluginC',
      };
    },
  });
  app.register(TokenA, PluginA);
  app.register(TokenC, PluginC);
  await throwsAsync(t, app.resolve.bind(app), 'Catches missing dependencies');
  t.end();
});

tape('dependency registration with null value', async t => {
  const app = new App('el', el => el);

  await doesNotThrowAsync(t, async () => {
    const PluginC = createPlugin({
      deps: {optionalNull: TokenEAsNullable},
      provides: deps => {
        t.equal(deps.optionalNull, null, 'null provided as expected');
      },
    });
    app.register(TokenEAsNullable, null);
    app.register(PluginC);
    await app.resolve();
  });

  await doesNotThrowAsync(t, async () => {
    const app = new App('el', el => el);
    // $FlowFixMe
    app.register(TokenString, null);
    app.middleware({something: TokenString}, ({something}) => {
      t.equal(something, null, 'null provided as expected');
      return (ctx, next) => next();
    });
    await app.resolve();
  });
  t.end();
});

tape('dependency registration with optional deps', async t => {
  const app = new App('el', el => el);

  const checkString = (s: string): void => {
    t.equals(s, 'hello', 'correct string value is provided');
  };
  const checkNumUndefined = (n: void | number): void => {
    t.equals(
      n,
      undefined,
      'no number value is provided for unregistered optional token'
    );
  };

  type Deps = {
    str: string,
    numOpt: void | number,
  };
  const PluginA = createPlugin({
    deps: {
      str: TokenString,
      numOpt: TokenNumber.optional,
    },
    provides: ({str, numOpt}: Deps) => {
      checkString(str);
      checkNumUndefined(numOpt);

      return {
        a: 'Hello',
      };
    },
  });
  app.register(TokenString, 'hello');
  app.register(PluginA);
  await app.resolve();
  t.end();
});

tape('dependency registration with missing deep tree dependency', async t => {
  const app = new App('el', el => el);
  const PluginA = createPlugin({
    provides: () => {
      return {
        a: 'PluginA',
      };
    },
  });
  const PluginB = createPlugin({
    deps: {a: TokenA, d: 'RANDOM-TOKEN'},
    provides: () => {
      return {
        b: 'PluginB',
      };
    },
  });
  const PluginC = createPlugin({
    deps: {a: TokenA, b: TokenB},
    provides: () => {
      return {
        c: 'PluginC',
      };
    },
  });
  app.register(TokenC, PluginC);
  app.register(TokenA, PluginA);
  app.register(TokenB, PluginB);
  await throwsAsync(t, app.resolve.bind(app), 'Catches missing dependencies');
  t.end();
});

tape('dependency registration with circular dependency', async t => {
  const app = new App('el', el => el);
  const PluginB = createPlugin({
    deps: {c: TokenC},
    provides: () => {
      return {
        b: 'PluginB',
      };
    },
  });
  const PluginC = createPlugin({
    deps: {b: TokenB},
    provides: () => {
      return {
        c: 'PluginC',
      };
    },
  });
  app.register(TokenB, PluginB);
  app.register(TokenC, PluginC);
  await throwsAsync(t, app.resolve.bind(app), 'Catches circular dependencies');
  t.end();
});

tape('dependency configuration with missing deps', async t => {
  const ParentToken: Token<string> = createToken('parent-token');
  const StringToken: Token<string> = createToken('string-token');
  const OtherStringToken: Token<string> = createToken('other-string-token');

  const app = new App('el', el => el);
  app.register(
    ParentToken,
    createPlugin({
      deps: {
        a: StringToken,
        b: OtherStringToken,
      },
      provides: () => {
        t.fail('should not get here');
        return 'service';
      },
    })
  );
  app.register(StringToken, 'string-a');
  await throwsAsync(
    t,
    app.resolve.bind(app),
    'throws if dependencies are not configured'
  );
  await throwsAsync(
    t,
    app.resolve.bind(app),
    /required by plugins registered with tokens: "parent-token"/
  );
  t.end();
});

tape('error message when dependent plugin does not have token', async t => {
  const StringToken: Token<string> = createToken('string-token');
  const OtherStringToken: Token<string> = createToken('other-string-token');

  const app = new App('el', el => el);
  app.register(
    createPlugin({
      deps: {
        a: StringToken,
        b: OtherStringToken,
      },
      provides: () => {
        t.fail('should not get here');
        return {};
      },
    })
  );
  app.register(StringToken, 'string-a');
  await throwsAsync(
    t,
    app.resolve.bind(app),
    /required by plugins registered with tokens: "UnnamedPlugin"/
  );
  t.end();
});

tape('Extraneous dependencies', async t => {
  const app = new App('el', el => el);
  const TestToken = createToken('test');
  app.register(TestToken, 'some-value');
  await throwsAsync(t, app.resolve.bind(app));
  t.end();
});

tape('Extraneous dependencies after re-registering', async t => {
  const app = new App('el', el => el);
  const TokenA = createToken('A');
  const TokenB = createToken('B');
  app.register(
    TokenA,
    createPlugin({
      deps: {b: TokenB},
    })
  );
  app.register(TokenB, 'test');
  app.register(TokenA, createPlugin({}));
  await doesNotThrowAsync(t, app.resolve.bind(app));
  t.end();
});

tape('Missing token errors reasonably', t => {
  const app = new App('el', el => el);
  // $FlowFixMe
  t.throws(() => app.register('some-value'), /Cannot register some-value/);
  const BrowserPlugin = null; // idiomatic browser plugin implementation for server-only plugin is `export default null`;
  // $FlowFixMe
  t.throws(() => app.register(BrowserPlugin), /Cannot register null/);
  t.end();
});

tape('retrieve dependency', async t => {
  const app = new App('el', el => el);
  const TokenA = createToken('a');
  const PluginA = createPlugin({
    provides: () => {
      return {
        a: 'Hello',
      };
    },
  });

  app.register(TokenA, PluginA);
  await app.resolve();
  t.equal(app.getService(TokenA).a, 'Hello');
  t.end();
});

tape('retrieve unresolved dependency', t => {
  const app = new App('el', el => el);
  const TokenA = createToken('a');
  const PluginA = createPlugin({
    provides: () => {
      return {
        a: 'Hello',
      };
    },
  });

  app.register(TokenA, PluginA);
  t.throws(
    () => app.getService(TokenA),
    /Cannot get service from unresolved app/
  );
  t.end();
});
