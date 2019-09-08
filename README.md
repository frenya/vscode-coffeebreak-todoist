# Coffee Break Todoist plugin

Todoist sync plugin for [Coffee Break](https://marketplace.visualstudio.com/items?itemName=frenya.vscode-coffeebreak)

## API token

When you run the synchronization for the first time, you will be asked for your API token.
You can find it in Todoist (Settings -> Integrations -> API token).

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
- `label_ids` (array[integer]) - The tasks labels (a list of label ids)"

## Recommended configuration

- create a `CofeeBreak` label in Todoist
- to find the ID of the newly created label, run the "Get Todoist Labels" command in VSCode
- set `command` and `label_ids` at workspace level
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
