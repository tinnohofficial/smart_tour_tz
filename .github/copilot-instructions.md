## Overview
This codebase is for a system called Smart Tour Tanzania, the project has 3 main folders: frontend, backend, and blockchain. There are 5 roles in the system; admin, tourist, tour guide, travel agent and hotel manager. And the tourists can book for their trips through the system. The system is very complex in that regard since it involves multiple steps of back and forth between user roles in the system.

## Follow these instructions
- Plz study and understand the whole codebase carefully, before implementing any feature so that u understand all (or the relevant) business flows at a very deep level before making any changes.

- Don't priotize running commands or tests, just implement the feature that u were asked to do, develop a deep level of understanding of the problem that is being solved and just make fixes to the code.

- Prioritize reusing the existing code and files as much as possible over creating new ones. Understand what has already been done thus far in order to not always be trying to reinvent the wheel. So what I mean is you should be highly considerate on the code and mostly edit it or try to improve it.

- If you wish to expirement or run commands or tests or have some mock data or what ever plz only use the playground folder. Don't put non-production code in the folders backend, frontend, or blockchain. Do very little of this if possible not at all, just fix the code without testing it, make sure that u put much focus on developing very good code and not just relying on tests. also the code u put should be clean and simple, don't overly complicate things plz.

- Additionally, when u make edits to the schema.sql, don't use sth like ALTER TABLE, instead just drop everything using the teardownDb.js script, so that the changes are reflected in the database. so that when u re run nodemon index.js, everything is created from scratch. (this is in very rare cases when u choose to run scripts)

- Take this with a grain of salt (Be considerate too): "plz note that the system is still under development, so you are free to change anything even the tables in schema.sql, and everything else u are allowed to break stuff, replace stuff change the file structure, reimplement some things and overall improve the codebase to make it cleaner and for it to implement all the required functional requirements, but plz only put the things that u were assigned in the request, don't add any extra features or additional unneccessary stuff.
