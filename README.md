# TestCafe Wrapper

Generate TestCafe unit tests by creating simple yaml files.

Install testcafe-wrapper
```sh
npm install -g testcafe-wrapper
```

##### Sample yaml file
```yaml
---
fixture:     Login Page
page:        https://xcel-uat.compuscan.co.za/login

fields:
    - identifier:   username
      selector:     input[name="username"]
      element:      input
      type:         text
      required:     true
    - identifier:   password
      selector:     input[name="password"]
      element:      input
      type:         password
      required:     true
    - identifier:   login
      selector:     button[type="submit"]
      element:      button
      type:         submit

functions:
    - name:     login
      logic:
          - typeText:
                identifier: username
                text:       API
          - typeText:
                identifier: password
                text:       dev1
          - click:
                identifier: login

tests:
    - name:         Validate Form
      logic:
          - validate:   login
    - name:         Invalid Username Login
      logic:
          - typeText:
                identifier: username
                text:       API
          - click:
                identifier: login

```

Generate the code and run the command
```
testcafe-wrapper run
```
