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

###### Full integration into TestRail
Created conf/testrail-conf.json
```json
{
    "host": "http://[testrail_url]/testrail/",
    "username": "testrail_username",
    "password": "testrail_password",
    "projectId": 1
}
```

To integrate test results straight into testrail add -t
```
testcafe-wrapper -t
```

For a list of available commands
```
testcafe-wrapper -help
```
