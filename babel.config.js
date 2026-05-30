module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: { '@': './src' },
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
      ],
      // Fix private class fields (#field) incompatible with older Hermes
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-private-methods',

      // Fix dynamic variable imports incompatible with Hermes
      // Caused by @supabase/supabase-js OpenTelemetry support
      function fixDynamicVariableImports({ types: t }) {
        return {
          visitor: {
            CallExpression(path) {
              if (
                path.node.callee.type === 'Import' &&
                path.node.arguments.length > 0 &&
                path.node.arguments[0].type === 'Identifier'
              ) {
                path.replaceWith(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier('Promise'),
                      t.identifier('resolve')
                    ),
                    [t.objectExpression([])]
                  )
                );
              }
            },
          },
        };
      },
    ],
  };
};
