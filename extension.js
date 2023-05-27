const vscode = require('vscode');
const simpleGit = require('simple-git');
const fs = require('fs');
const request = require('request');
const shelljs = require('shelljs');
const axios = require('axios');

/**
 * @param {vscode.ExtensionContext} context
 */

function getPanel1Content(scriptUri, styleUri) {
	return `	<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">	
			<title>Virtual Labs Experiment Authoring Environment</title>
			<link rel="stylesheet" href="${styleUri}">
		</head>
		<body>
		<div class="command1">
			<button class="sideButton" id="command1">Initialize Experiment</button>
		</div>
		<div class="command2">
			<button class="sideButton" id="command2">Validate</button>
		</div>
		<div class="command3">
			<button class="sideButton" id="command3">Build Local</button>
		</div>
		<div class="command4">
			<button class="sideButton" id="command4">Deploy Local</button>
		</div>
		<div class="command5">
			<button class="sideButton" id="command5">Clean</button>
		</div>
		<div class="command6">
			<button class="sideButton" id="command6">Deploy for Testing</button>
		</div>
		<div class="command7">
			<button class="sideButton" id="command7">Submit for Review</button>
		</div>
		<div class="command8">
			<button class="sideButton" id="command8">Help</button>
		</div>
		</body>
		<script src="${scriptUri}"></script>
		</html>
		`
}
function cloneWebView() {
	const panel = vscode.window.createWebviewPanel(
		'virtualLabs', // Identifies the type of the webview. Used internally
		'Virtual Labs Experiment Authoring Environment', // Title of the panel displayed to the user
		vscode.ViewColumn.One, // Editor column to show the new webview panel in.
		{
			enableScripts: true
		}
	);


	const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
	const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(__dirname + '/webview.js'));
	const styleUri = panel.webview.asWebviewUri(vscode.Uri.file(__dirname + '/webview.css'));

	panel.webview.html = getWebviewContent(scriptUri, styleUri);

	panel.webview.onDidReceiveMessage(message => {
		switch (message.command) {
			case 'clone':
				const experimentName = message.experimentName;
				const branch = message.branch;
				const organization = message.organization;
				const link = 'https://github.com/' + organization + '/' + experimentName + '.git';
				const git = simpleGit();
				const path = vscode.workspace.workspaceFolders[0].uri.fsPath + '/' + experimentName;
				// check if the experiment is already cloned
				if (fs.existsSync(path)) {
					vscode.window.showInformationMessage("Experiment Repository already exists");
					panel.dispose();
					break;
				}
				git.clone(link, path, (err) => {
					if (err) {
						vscode.window.showErrorMessage("Error cloning repository: " + err);
						panel.dispose();
						return
					} else {
						// checkout the branch to dev 
						git.cwd(path);
						git.checkout(branch, (err) => {
							if (err) {
								vscode.window.showErrorMessage("Error checking out branch: " + err);
								return
							} else {
								panel.dispose();
								vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(path)).then(() => {
									vscode.window.showInformationMessage("Experiment Repository cloned successfully and branch checked out");
								});
							}
						});

					}
				});

				panel.dispose();
				break;
			case 'addBranch':
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

						panel.webview.html = getWebviewContent(scriptUri, styleUri);
						return
					}
					else {
						config.branches.push(branch);
						fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config));
						panel.webview.html = getWebviewContent(scriptUri, styleUri);
						vscode.window.showInformationMessage('Branch added successfully');
					}
				}
				addBranch();
				break;
			case 'addOrganization':
				async function addOrganization() {
					const organization = await vscode.window.showInputBox({
						placeHolder: "Enter the organization name",
						validateInput: (value) => {
							if (value == null) return;
							if (value.length == 0) return "Organization name cannot be empty";
						}
					});
					if (organization == null) return;


					if (config.organizations.includes(organization)) {
						vscode.window.showInformationMessage("Organization already exists");

						panel.webview.html = getWebviewContent(scriptUri, styleUri);
						return;
					}
					const url = 'https://github.com/' + organization;
					request.head(url, (error, response, body) => {
						if (error) {
							return;
						}
						if (response.statusCode == 404) {
							vscode.window.showErrorMessage("Organization does not exist");

							panel.webview.html = getWebviewContent(scriptUri, styleUri);
							return;
						}
						else {
							config.organizations.push(organization);
							fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config));

							panel.webview.html = getWebviewContent(scriptUri, styleUri);
							vscode.window.showInformationMessage('Organization added successfully');
						}
					});
				}
				addOrganization();
				break;
		}
	});

}

async function runCommandWithProgress(command, object) {
	return vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: "Deploying...",
			cancellable: true,
		},
		async (progress, token) => {
			return new Promise((resolve, reject) => {
				const child = shelljs.exec(command, { async: true }, (code, stdout, stderr) => {
					if (code === 0) {
						resolve();
					} else {
						reject(new Error(`Command '${command}' failed with exit code ${code}.`));
					}
				});
				const panel = vscode.window.createWebviewPanel(
					'vlabs.buildexp',
					'Deploy logs',
					vscode.ViewColumn.One,
					{
						enableScripts: true
					}
				);
				let localData = "";
				child.stdout.on("data", (data) => {
					// pretty print the logs.stdout
					const logsContent = `<pre>${data.toString()}</pre>`;
					localData += logsContent;
					panel.webview.html = localData;
				});

				token.onCancellationRequested(() => {
					child.kill();
					vscode.window.showInformationMessage(`Deploying cancelled by the user.`);
				});
			});
		}
	);
}

async function runCommand(command, myObject) {
	await runCommandWithProgress(command, myObject);
}


function buildScript(command) {
	// check if the current directory has a package.json file
	const path = vscode.workspace.workspaceFolders[0].uri.fsPath;
	const packageJsonPath = path + '/package.json';
	const nodePath = process.execPath;
	// set the path of the nodejs binary as the path of the shelljs
	shelljs.config.execPath = nodePath;
	shelljs.cd(path);
	console.log("previous",path)
	// dispaly a waiting vscode window
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Please wait while the command is running",
		cancellable: false,
	}, (progress, token) => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, 1000);
		});
	});
	if (!fs.existsSync(packageJsonPath)) {
		shelljs.exec('npm init -y');
	}
	shelljs.exec('npm i vlabs-buildexp@latest');

	let logs = null
	let panelTitle = ""
	switch (command) {
		case 'command2':
			logs = shelljs.exec('npx vlabs-buildexp validate');
			panelTitle = "Validation Logs"
			vscode.window.showInformationMessage('Validation successful, you can see the logs in the window');
			break;

		case 'command3':
			logs = shelljs.exec('npx vlabs-buildexp clean-build-exp');
			vscode.window.showInformationMessage('Build successful, you can see the logs in the window');
			panelTitle = "Build Logs"
			break;
		case 'command4':
			// check if the build directory exists
			const buildPath = path + '/build';
			console.log(buildPath)
			if (!fs.existsSync(buildPath)) {
				vscode.window.showErrorMessage('Build directory does not exist, please run the build command first');
				return;
			}
			let myObject = { logs2: null };
			runCommand('npx vlabs-buildexp deploy', myObject)
			break;
		case 'command5':
			logs = shelljs.exec('npx vlabs-buildexp clean');
			vscode.window.showInformationMessage('Cleaned the build directory');
			panelTitle = "Clean Logs"
			break;
	}

	if (command == 'command4') { return; }
	const panel = vscode.window.createWebviewPanel(
		'vlabs.buildexp',
		panelTitle,
		vscode.ViewColumn.One,
		{
			enableScripts: true
		}
	);
	// pretty print the logs.stdout
	const logsContent = `<pre>${logs.stdout}</pre>`;
	panel.webview.html = logsContent;
}
async function pushAndMerge() {

	const path = vscode.workspace.workspaceFolders[0].uri.fsPath;
	const nodePath = process.execPath;
	// set the path of the nodejs binary as the path of the shelljs
	shelljs.config.execPath = nodePath;
	shelljs.cd(path);


	if (shelljs.exec('git rev-parse --is-inside-work-tree').code !== 0) {
		vscode.window.showErrorMessage('Sorry, this is not a git repository');
		return;
	}
	// create a webview panel
	const panel = vscode.window.createWebviewPanel(
		'vlabs.buildexp',
		'User Details',
		vscode.ViewColumn.One,
		{
			enableScripts: true
		}
	);
	const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(__dirname + '/push.js'));
	const styleUri = panel.webview.asWebviewUri(vscode.Uri.file(__dirname + '/webview.css'));

	panel.webview.html = getWebviewFormContent(scriptUri, styleUri);
	// virtual-labs
	const repo = 'https://github.com/virtual-labs/repo.git'
	let remote = ""
	let commitMessage = ""
	panel.webview.onDidReceiveMessage(message => {
		switch (message.command) {
			case 'push':
				const userName = message.userName;
				const personalAccessToken = message.personalAccessToken;
				commitMessage = message.commitMessage;
				remote = repo.replace("https://", "https://" + userName + ":" + personalAccessToken + "@")
				// extract the current directory name
				const currentDir = path.split('/').pop();
				remote = remote.replace("repo", currentDir);
				
				const git = simpleGit();
				// check if .gitignore file exists
				const gitignorePath = path + '/.gitignore';
				console.log(gitignorePath)
				if (!fs.existsSync(gitignorePath)) {
					// ignore node_modules and build directory
					fs.writeFileSync(gitignorePath, 'node_modules\nbuild');
				}
				git.add('./*').then(() => {
					git.commit(commitMessage).then(() => {
						return git.getRemotes(true)
							.then((remotes) => {
								if (remotes.some((remote) => remote.name === 'origin')) {
									return Promise.resolve();
								} else {
									return git.addRemote('origin', remote);
								}
							});
					}).then(() => {
						git.push(remote, 'dev').then(() => {
							git.fetch(remote, 'testing').then(() => {
								git.checkout('testing').then(() => {
									git.mergeFromTo('dev', 'testing').then(() => {
										git.push(remote, 'testing').then(() => {
											vscode.window.showInformationMessage('Pushed to dev and merged to testing');
											git.checkout('dev').then(() => {
												vscode.window.showInformationMessage('You can start working again');
											}).catch((err) => {
												vscode.window.showErrorMessage("Could not checkout back to dev: " + err);
											})
										}).catch((err5) => {
											vscode.window.showErrorMessage("Error while pushing to testing: " + err5);
										})
									}).catch((err4) => {
										vscode.window.showErrorMessage("Error while merging: " + err4);
										git.checkout('dev').then(() => {
										}).catch((err) => {
											vscode.window.showErrorMessage("Could not checkout back to dev: " + err);
										})
									})
								}).catch((err3) => {
									vscode.window.showErrorMessage("Error while checking out: " + err3);
								})
							}).catch((err2) => {
								vscode.window.showErrorMessage("Error while fetching: " + err2);
							})
						}).catch((err1) => {
							vscode.window.showErrorMessage("Error in pushing to dev: " + err1);
						})
					}).catch((err) => {
						vscode.window.showErrorMessage("Error in commit: " + err);
					})
				}).catch((err) => {
					vscode.window.showErrorMessage("Error in add: " + err);
				})
				break;
		}
	}, undefined, context.subscriptions);

}
function getPRContent(scriptUri, styleUri) {
	return `
	<!DOCTYPE html>
		<html lang="en">

		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Virtual Labs Experiment Authoring Environment</title>
			<link rel="stylesheet" href="${styleUri}">
		</head>

		<body>
			<h1>Virtual Labs Experiment Authoring Environment</h1>
			<div class="Organization">
				<label for="userName">Pull Request Title</label>
				<input type="text" id="title" name="userName">
				
				
			</div>
			<div class="Experiment">
				<label for="personalAccessToken">Personal Access Token</label>
				<input type="text" id="personalAccessToken" name="personalAccessToken">
			</div>
			<div class="Branch">
				<label for="commitMessage">Description</label>
				<textarea id="description" name="commitMessage" ></textarea>
			</div>
			<button id="pr" class="bigButton">Submit</button>
			
			<script  src="${scriptUri}"></script>
		</body>

		</html>`
}

function raisePR()	{

	const path = vscode.workspace.workspaceFolders[0].uri.fsPath;
	const nodePath = process.execPath;
	// set the path of the nodejs binary as the path of the shelljs
	shelljs.config.execPath = nodePath;
	shelljs.cd(path);


	if (shelljs.exec('git rev-parse --is-inside-work-tree').code !== 0) {
		vscode.window.showErrorMessage('Sorry, this is not a git repository');
		return;
	}
	// create a webview panel
	const panel = vscode.window.createWebviewPanel(
		'vlabs.buildexp',
		'User Details',
		vscode.ViewColumn.One,
		{
			enableScripts: true
		}
	);
	const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(__dirname + '/pr.js'));
	const styleUri = panel.webview.asWebviewUri(vscode.Uri.file(__dirname + '/webview.css'));

	panel.webview.html = getPRContent(scriptUri, styleUri);
	panel.webview.onDidReceiveMessage(message => {
		switch (message.command) {
			case 'pr':
				const title = message.title;
				const personalAccessToken = message.personalAccessToken;
				const description = message.description
				

				const headers = {
					Authorization: 'Bearer ' + personalAccessToken,
					'Content-Type': 'application/json',
				};
				const baseURL = "https://api.github.com"
				// Define the pull request details
				const owner = 'virtual-labs';
				const repo = 'tool-vscode-plugin';
				const base = 'main'; // Base branch (target branch)
				const head = 'testing'; // Head branch (source branch)
			
				// Create the pull request
				axios.post(`${baseURL}/repos/${owner}/${repo}/pulls`, {
					title,
					description,
					head,
					base
				}, {
					headers
				})
				.then(response => {
					vscode.window.showInformationMessage('Pull request created successfully');
					console.log('Pull request created:', response.data.html_url);
				})
				.catch(error => {
					vscode.window.showErrorMessage("Error occured: "+error);
					console.error('Error creating pull request:', error.response.data.message);
				});
				break;
			}
		}, undefined, context.subscriptions);

}
function activate() {
	vscode.window.registerWebviewViewProvider(
		'vlabs.experimentView', // Identifies the type of the webview. Used internally

		{
			resolveWebviewView: (view) => {
				view.webview.options = {
					enableScripts: true,
				};
				const scriptUri = view.webview.asWebviewUri(vscode.Uri.file(__dirname + '/sidebar.js'));
				const styleUri = view.webview.asWebviewUri(vscode.Uri.file(__dirname + '/sidebar.css'));
				view.webview.html = getPanel1Content(scriptUri, styleUri);
				view.webview.onDidReceiveMessage(async (message) => {
					switch (message.command) {
						// close the webview panel after the user selects the command
						case 'command1':
							// check if a directory is open in vscode
							if (vscode.workspace.workspaceFolders == null) {
								vscode.window.showErrorMessage("Please open a directory in vscode");
								break;
							}
							cloneWebView();
							break;
						// in all other cases, build the script
						case 'command6':
							await pushAndMerge();
							break;
						case 'command7':
							raisePR();
							break;
						case 'command8':
							// open the README.md file of this extension
							const path = vscode.Uri.file(__dirname + '/README.md');
							vscode.commands.executeCommand('markdown.showPreview', path);
							break;
						default:
							buildScript(message.command);
							break;
					}
				}
				);

			}
		}
	);

}

function getWebviewFormContent(scriptUri, styleUri) {
	return `
	<!DOCTYPE html>
		<html lang="en">

		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Virtual Labs Experiment Authoring Environment</title>
			<link rel="stylesheet" href="${styleUri}">
		</head>

		<body>
			<h1>Virtual Labs Experiment Authoring Environment</h1>
			<div class="Organization">
				<label for="userName">Github User Name</label>
				<input type="text" id="userName" name="userName">
				
				
			</div>
			<div class="Experiment">
				<label for="personalAccessToken">Personal Access Token</label>
				<input type="text" id="personalAccessToken" name="personalAccessToken">
			</div>
			<div class="Branch">
				<label for="commitMessage">Commit Message</label>
				<textarea id="commitMessage" name="commitMessage" ></textarea>
			</div>
			<button id="push" class="bigButton">Submit</button>
			
			<script  src="${scriptUri}"></script>
		</body>

		</html>`
}

function getWebviewContent(scriptUri, styleUri) {

	// const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
	// const branches = config.branches;
	// const organizations = config.organizations;
	// const branchOptions = branches.map(branch => `<option value="${branch}">${branch}</option>`).join('');
	const branchOptions = "dev"
	const organizationOptions = "virtual-labs"
	// const organizationOptions = organizations.map(organization => `<option value="${organization}">${organization}</option>`).join('');


	return `
	<!DOCTYPE html>
		<html lang="en">

		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Virtual Labs Experiment Authoring Environment</title>
			<link rel="stylesheet" href="${styleUri}">
		</head>

		<body>
			<h1>Virtual Labs Experiment Authoring Environment</h1>
			<div class="Organization">
				<label for="organization">Organization</label>
				<div class="select-container">
				<input id="organization" name="organization" type="text" value="${organizationOptions}" disabled>
				</div>
			</div>
			<div class="Experiment">
				<label for="experimentName">Experiment Repository Name</label>
				<input type="text" id="experimentName" name="experimentName">
			</div>
			<div class="Branch">
				<label for="branch">Branch</label>
				<div class="select-container">
				<input id="branch" name="branch" type="text" value="${branchOptions}" disabled>
				</div>
			</div>
			<button id="submit" class="bigButton">Submit</button>
			
			<script  src="${scriptUri}"></script>
		</body>

		</html>`
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
