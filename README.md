# Coffee Break Todoist plugin

Todoist sync plugin for [Coffee Break](https://marketplace.visualstudio.com/items?itemName=frenya.vscode-coffeebreak)

## Configuraton

See sample configuration below. This can be done both at workspace or folder level (the latter overrides the former).

```json
{
  ...
  "coffeebreak.sync": {
    "command": "coffeebreak.todoist.sync",
    "project_id": 12345678,
    "labels": [ 121212, 343434 ]
  },	
  ...
}
```

## Mandatory attributes

- `command` (string) - name of the sync command to run
  
## Optional attributes

The following attributes may be provided and will be pass on to the Todoist API.


- `project_id` (integer) - The id of the project to add the task to. By default the task is added to the user’s Inbox project."
- `priority` (integer) - The priority of the task (a number between 1 and 4, 4 for very urgent and 1 for natural)"
- `labels` (array[integer]) - The tasks labels (a list of label ids)"
- `assigned_by_uid` (integer) - The id of user who assigns the current task. This makes sense for shared projects only. Accepts 0 or any user id from the list of project collaborators. If this value is unset or invalid, it will be automatically setup to your uid.
- `responsible_uid` (integer) - The id of user who is responsible for accomplishing the current task. This makes sense for shared projects only. Accepts any user id from the list of project collaborators or null or an empty string to unset.

## Recommended configuration

- create a `CofeeBreak` label in Todoist and find its ID
- set `command` and `labels` at workspace level
- set `project_id` at folder level to have tasks from different folders synchronized to different projects in Todoist

**Workspace:**

```json
{
  ...
  "coffeebreak.sync": {
    "command": "coffeebreak.todoist.sync",
    "labels": [ <id-of-CoffeeBreak-label> ]
  },	
  ...
}
```

**Folder:**

```json
{
  ...
  "coffeebreak.sync": {
    "project_id": 12345678
  },	
  ...
}
```
