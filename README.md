# <img src="https://objectreef.dev/reef.png" width="25" />  The Octopus Basic 

This is the basic demo application made for ObjectReef service. Although it is very simple and does not contain much source code, it meets the requirements of a complete and functional SPA. The sample is released under the terms of the MIT license, the content of which you can find [here](./LICENSE.md).

The application is used for simple tasks management. They can be organized in lists and presented as a flat datagrid as well as a kanban board. Each task can have a description, checklist, tags or required completion date. It is also possible to assign responsibility to different people and present tasks assigned to a signed-in user. Tasks as well as entire lists can also be archived.

Sample screens:

<img src="doc/daragrid.png" width="640" alt="datagrid"/>
<img src="doc/kanban.png" width="640" alt="kanban"/>
<img src="doc/task.png" width="640" alt="task"/>


**NOTE:** This is only frontend part of the application. Backend source code you can find at [https://github.com/HumanDialog/octopus.mini.reef](https://github.com/HumanDialog/octopus.mini.reef)

## Prerequisites
The website requires backend service launched on your local machine. To launch backend service see https://github.com/HumanDialog/octopus.mini.reef/README.md first.

This sample based on [Svelte](https://svelte.dev/) therefore requires [node.js](https://nodejs.org/en) installed on your local machine.

## Launch
In the repository root directory run  
`npm install`  
and then  
`npm run dev`

Note that this project is only an SPA application and still needs the API service running for proper operation. You can find a repository of the backend service at https://github.com/HumanDialog/octopus.mini.reef. In the description of this project you will find more details, including how to run, compile and fill-in with sample data.

Make sure that the address of the local API service is correct. You can find the setting in the `App.svelte` file:
```js
    reef.configure( {
        mode: 'local',
        ...
        local: {
            api:    "http://127.0.0.1:1996/",
```

In case you would like to deploy an application based on this one, be sure to set the Identity Provider parameters correctly. According to OAuth2 standards, the application should be registered as a client width `clientID` and `clientSecret`. For more information about registering new client, see [ObjectReef documentation](https://objectreef.dev/doc/reef-cli-402/app-management-commands-reef-add-client). 

The parameters of the registered client, such as `clientID` and `clientSecret` must be entered in the `App.svelte` file`:
```js
    reef.configure( {
        mode: 'remote',
        remote: {
            iss :      "https://objectreef.io",
            clientID : "REGISTERED_CLIENT_ID",
            clientSecret: "REGISTERED_CLIENT_SECRET",
            scope :     "openid profile email DEPLOYED_REEF_APP_ID",
            apiVersion: "v001"
            ...
``` 

Note that switching between API connection on `localhost` and deployed service is possible through the `mode` parameter:
```js
    reef.configure( {
        mode: 'remote', // or 'local'
        ...      
``` 

The detailed description of the source code you can find on ObjectReef website at https://objectreef.dev/samples/octopus-basic.

## Dependencies
For the sake of clarity of the example, we use the [@humandialog/forms.svelte](https://github.com/HumanDialog/forms.svelte) components library available under the MIT license.

Authorization is provided by the npm package [@humandialog/auth.svelte](https://github.com/HumanDialog/auth.svelte) available under the MIT license.

The full list of dependencies, along with their versions, can be found in the [package.json](./package.json) file.

## About ObjectReef
ObjectReef is a complete platform to design, test and deploy any high performance backend service. It ensures robust, scalability and security with zero tech debt. That Low Code Backend as a Services (BaaS) solution offers you everything you need to develop, maintain, integrate and run the software without the advanced technical knowledge.

No matter, if you are creating the simple or complex and critical product, ObjectReef is the platform, that simplifies the process of delivering the application backend. It has never been so quick and so robust.

More info you'll find at [https://objectreef.dev/](https://objectreef.dev/)

 