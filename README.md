# TestCafe Wrapper

Generate TestCafe unit tests by creating simple yaml files.

Install testcafe-wrapper
```sh
npm install -g testcafe-wrapper
```

##### Sample yaml file
```yaml
---
fixture:     Example
page:        http://devexpress.github.io/testcafe/example/

fields:
    - identifier:   submit
      selector:     button[type="submit"]
      element:      button
      type:         submit

tests:
    - name:         Type in a developer name and click submit
      logic:
          - action      : click
            identifier  : submit
```

Generate the code and run the command
```
testcafe-wrapper
```

For a list of available commands
```
testcafe-wrapper -help
```
