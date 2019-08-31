# Coffee Break Todoist plugin

Todoist sync plugin for Coffee Break

## Additional attributes

Additional parameters to pass to the Todoist API

- project_id (integer) - The id of the project to add the task to. By default the task is added to the user’s Inbox project."
- priority (integer) - The priority of the task (a number between 1 and 4, 4 for very urgent and 1 for natural)"
- labels (array[integer]) - The tasks labels (a list of label ids)"
- assigned_by_uid (integer) - The id of user who assigns the current task. This makes sense for shared projects only. Accepts 0 or any user id from the list of project collaborators. If this value is unset or invalid, it will be automatically setup to your uid.
- responsible_uid (integer) - The id of user who is responsible for accomplishing the current task. This makes sense for shared projects only. Accepts any user id from the list of project collaborators or null or an empty string to unset.
