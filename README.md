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
    - identifier:   developer-name
      selector:     '#developer-name'
      element:      input
      type:         text
    - identifier:   submit
      selector:     button[type="submit"]
      element:      button
      type:         submit

tests:
    - name:         Type in a developer name and click submit
      logic:
          - typeText:
                identifier: developer-name
                text:       John Doe
          - click:
                identifier: submit

```

Generate the code and run the command
```
testcafe-wrapper run
```

For a list of available commands
```
testcafe-wrapper -help
```
