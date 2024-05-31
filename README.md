# custom-automation-sample

- ECS サービスの必要タスク数を変更する Automation の検証

### ChangeScaleECSService

必要なタスク数を変更する

**Parameters**

| key         | type   | description                                                                           | default   | allowedValues           |
| ----------- | ------ | ------------------------------------------------------------------------------------- | --------- | ----------------------- |
| Environment | String | 環境                                                                                  | `staging` | `staging`, `production` |
| Mode        | String | 節約: タスクを 1 つに変更<br>通常: タスクを 2 つに変更<br>高負荷: タスクを 3 つに変更 | `節約`    | `節約`,`通常`,`高負荷`  |
