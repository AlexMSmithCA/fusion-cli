This file tracks the commit SHAs for specific versions of fusion-cli:

- v2.14.0: 7e0236812b0f54c1001caea88837245012e883fb
- v2.17.2: 0a2e7b3df649627d5564f3ea6aa6d0584219abdc

If you wish to consume a specific version in your service, you can do so by adding the following line to your `package.json`'s `dependencies` property with the appropriate commit:

```
"dependencies": {
  ...
  "fusion-cli": "https://github.com/alexmsmithca/fusion-cli.git#commit=7e0236812b0f54c1001caea88837245012e883fb",
  ...
}
```