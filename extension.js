// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const simpleGit = require('simple-git');
const fs = require('fs');
const { JSDOM } = require("jsdom");
const request = require('request');

/**
 * @param {vscode.ExtensionContext} context
 */
function handlerFn(err) {
	if (err) {
		console.log(err);
		vscode.window.showErrorMessage("Error while cloning the repository");
	}
	else {
		vscode.window.showInformationMessage("Repository cloned successfully");
	}
}

function updatedWebviewContent() {
	const htmlContent = getWebviewContent();
	const dom = new JSDOM(htmlContent, {
	  runScripts: "dangerously"
	});
	const { document } = dom.window;
	
	const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
	const organization = config.organizations;
	const branch = config.branches;
	
	const branches = document.getElementById('branch');
	
	for (let i = 0; i < branch.length; i++) {
	  const option = document.createElement('option');
	  option.text = branch[i];
	  branches.add(option);
	}
	
	const organizations = document.getElementById('organization');
	
	for (let i = 0; i < organization.length; i++) {
	  const option = document.createElement('option');
	  option.text = organization[i];
	  organizations.add(option);
	}
	
	const webviewScript= document.createElement("script");
	const jscontent = fs.readFileSync(__dirname + '/webview.js', 'utf8');
	webviewScript.textContent = jscontent;


	
	webviewScript.addEventListener('load', function() {
		// JS code has been loaded and is ready to execute
		// Put your code here
		console.log("here");
	  });
	document.body.appendChild(webviewScript);
	
	const style = document.createElement("style");
	const csscontent = fs.readFileSync(__dirname + '/webview.css', 'utf8');
	style.textContent = csscontent;
	document.body.appendChild(style);
	
	// fire the load event manually for script
	const updatedHtml = dom.serialize();
	console.log(updatedHtml);
	
	return updatedHtml;


}
function activate(context) {

	console.log('Congratulations, your extension "virtual-labs-experiment-generator" is now active!');

	let options = [
		{
			label: "Clone the experiment repository",
			description: "Clones the experiment repository from the Virtual Labs github",
		},
		{
			label: "Command 2",
			description: "Build the experiment on the local machine",
		},
		{
			label: "Command 3",
			description: "Run validations and performance measurement",
		},
		{
			label: "Command 4",
			description: "Instantiate a web-server",
		}
	];

	let disposable = vscode.commands.registerCommand(
		'virtual-labs-experiment-generator.virtualLabs',
		async function () {
			const functionality = await vscode.window.showQuickPick(options)
			if (functionality == null) return;
			if (functionality.label == "Clone the experiment repository") {

				// open a vs code webview dialog box to enter the experiment name and branch
				const panel = vscode.window.createWebviewPanel(
					'virtualLabs', // Identifies the type of the webview. Used internally
					'Virtual Labs Experiment Generator', // Title of the panel displayed to the user
					vscode.ViewColumn.One, // Editor column to show the new webview panel in.
					{
						enableScripts: true
					}
				);
				
				
				const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
				const htmlContent= updatedWebviewContent();
				panel.webview.html = htmlContent;

				panel.webview.onDidReceiveMessage(message => {
					switch (message.command) {
						case 'clone':
							const experimentName = message.experimentName;
							const branch = message.branch;
							const organization = message.organization;
							const link = 'https://github.com/' + organization + '/' + experimentName + '.git';
							const git = simpleGit();
							const options = ['--depth', '1', '--branch', branch];
							const path = vscode.workspace.workspaceFolders[0].uri.fsPath + '/' + experimentName;
							// check if the experiment is already cloned
							if (fs.existsSync(path)) {
								vscode.window.showInformationMessage("Experiment Repository already exists");
								panel.dispose();
								break;
							}
							git.clone(link, path, options, handlerFn);
							panel.dispose();
							break;
						case 'addBranch':
							// take a text input from the user and add it to the config file using async await
							async function addBranch() {
								const branch = await vscode.window.showInputBox({
									placeHolder: "Enter the branch name",
									validateInput: (value) => {
										if (value == null) return;
										if (value.length == 0) return "Branch name cannot be empty";
									}
								});
								if (branch == null) return;
								// check if the branch already exists
								if (config.branches.includes(branch)) {
									vscode.window.showInformationMessage("Branch already exists");
									// reload the webview
									
									panel.webview.html = updatedWebviewContent();
									return
								}
								else {
									config.branches.push(branch);
									fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config));
									panel.webview.html = updatedWebviewContent();
									vscode.window.showInformationMessage('Branch added successfully');
								}
							}
							addBranch();
							break;
						case 'addOrganization':
							// take a text input from the user and add it to the config file using async await
							async function addOrganization() {
								const organization = await vscode.window.showInputBox({
									placeHolder: "Enter the organization name",
									validateInput: (value) => {
										if (value == null) return;
										if (value.length == 0) return "Organization name cannot be empty";
									}
								});
								if (organization == null) return;
								// check on github if the organization exists


								if (config.organizations.includes(organization)) {
									vscode.window.showInformationMessage("Organization already exists");
									
									panel.webview.html = updatedWebviewContent();
									return;
								}
								const url = 'https://github.com/' + organization;
								request.head(url, (error, response, body) => {
									if (error) {
										console.log(error);
										return;
									}
									if (response.statusCode == 404) {
										vscode.window.showErrorMessage("Organization does not exist");
								
										panel.webview.html = updatedWebviewContent();
										return;
									}
									else {
										config.organizations.push(organization);
										fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config));
										
										panel.webview.html = updatedWebviewContent();
										vscode.window.showInformationMessage('Organization added successfully');
									}
									console.log(response.statusCode);
								});
							}
							addOrganization();
							break;
					}
				}, undefined, context.subscriptions);
			}

			vscode.window.showInformationMessage('Virtual Labs Experiment Generator is now Active!');
		});

	context.subscriptions.push(disposable);
}


function getWebviewContent() {

return `
	<!DOCTYPE html>
		<html lang="en">

		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Virtual Labs Experiment Generator</title>
		</head>

		<body>
			<h1>Virtual Labs Experiment Generator</h1>
			<div class="Organization">
				<label for="organization">Organization</label>
				<select id="organization" name="organization">
					Organization
						</select>
				<button class="smallButton"  id="addOrganization">Add Organization</button>
			</div>
			<div class="Experiment">
				<label for="experimentName">Experiment Name</label>
				<div class="Name">
					<input type="text" id="experimentName" name="experimentName">
				</div>
			</div>
			<div class="Branch">
				<label for="branch">Branch</label>
				<select id="branch" name="branch">
				</select>
				<button class="smallButton" id="addBranch">Add Branch</button>
			</div>
			<button id="submit" class="bigButton">Submit</button>
		</body>

		</html>`
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
