# Virtual Labs Experiment Authoring Environment

**Virtual Labs** is an initiative by the Ministry of Education, Government of India, that provides remote access to simulation-based labs across various disciplines in Science and Engineering. This initiative allows students to engage in a free, interactive laboratory learning experience through remote experimentation.

This document explains how to use the **Visual Studio Code Extension** designed to streamline the process of authoring Virtual Labs experiments. The extension simplifies common tasks in experiment development.

## Getting Started

1. **Install the Extension:**
    * Search for **Virtual Labs Experiment Authoring Environment** in the Visual Studio Code Marketplace and install the extension.
2. **Open a Folder:**
    * Open the folder in Visual Studio Code where you want to create the experiment repository.
3. **Access the Extension:**
    * Click the extension icon located on the left panel of Visual Studio Code.
      <center><img src="https://raw.githubusercontent.com/virtual-labs/tool-vscode-plugin/main/images/sidebar.png"<br> </center>
4. **Options in the Sidebar:** The following options will appear in the sidebar:
    * **Initialize Experiment:**
      Prompts you to enter the experiment repository name. Upon submission, a new folder is created inside the current directory.
      <center><img src="https://raw.githubusercontent.com/virtual-labs/tool-vscode-plugin/main/images/clone.png"<br> </center>   
    * **Validate:**
      Runs code validation using ESLint and validates the experiment descriptor against a predefined schema.
    * **Build Local:**  
        Generates a `build` folder inside the repository and builds the experiment locally.
    * **Deploy Local:** 
        Deploys the experiment on a local web server for testing.
    * **Clean:**
        Deletes the `build` folder to reset the environment.
    * **Deploy for Testing:**
        * Pushes the experiment to the testing branch of the repository and deploys it on GitHub Pages.
            * **Github Username:** Enter the developer's GitHub username.
            * **Personal Access Token:** Generate one by [following these steps.](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token).
            * **Commit Message:**  Add a short summary of the changes.
            <center><img src="https://raw.githubusercontent.com/virtual-labs/tool-vscode-plugin/main/images/deploy.png"<br> </center>    
    * **Submit for Review:** 
        * Raises a pull request (PR) to the `main` branch of the repository.
            * **Pull Request Title:** Title for the PR.
            * **Personal Access Token:** Refer to these [step](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token).
            * **Description:** Briefly summarize the pull request.
            <center><img src="https://raw.githubusercontent.com/virtual-labs/tool-vscode-plugin/main/images/pR.png"<br> </center>

## Known issues and Workarounds:
Below are common issues and their solutions to ensure smooth usage of the extension:

* **npm and node.js Versions:**
  * **Issue:** Using outdated versions of `npm` or node.js may cause compatibility issues.
  * **Workaround:** Ensure you’re using the latest versions of `npm` and `node.js`. The minimum required version for `node.js` is 16.0.0.

* **Visual Studio Code Version:**
  * **Issue:** An outdated Visual Studio Code version may impact the extension’s functionality.
  * **Workaround:** Update to the latest version of Visual Studio Code.

* **Blank validate.log or build.log on Windows:**
  * **Issue:** On Windows, the extension might generate blank `validate.log` or `build.log` files.
  * **Workaround:** 
    1. Run these commands in the VSCode terminal:
        * `npm install -g shelljs`
        * `npm install cjs`
        * `npm install inflight --save`
        * `npm install triple-beam --save`
        * `npm install stack-trace --save`
    2. Uninstall the Virtual Labs Extension.
    3. Close and reopen Visual Studio Code.
    4. Reinstall the Virtual Labs Extension.

* **Multiple Experiment Folders in the Same Directory:**
  * **Issue:** If multiple experiment folders exist in the same directory, the extension may not function as expected.
  * **Workaround:** Open the specific folder in Visual Studio Code. The extension operates only within the currently opened folder.

* **Deploy for Testing - Write Permissions:**
  * **Issue:** The `Deploy for Testing` feature requires write permissions to the repository.
  * **Workaround:** Ensure you have the necessary permissions. If not, request access from the repository owner.

* **Branch Management:**
  * **Issue:** After initializing an experiment, the branch is automatically set to `dev`.
  * **Workaround:** Do not manually change the branch via the terminal; the extension handles branch management.

* **Directory Names:**
  * **Issue:** Directory names containing spaces can cause issues during deployment.
  * **Workaround:** Ensure directory names are free of spaces.

* **Testing Content Changes:**
  * **Issue:** Changes to experiment content may not reflect immediately during testing.
  * **Workaround:** Stop the current session and click **Deploy for Testing** again.

## Developer Support
If you encounter bugs or difficulties while using the extension, follow these steps:

* Take a screenshot of the issue.
* Briefly describe the steps leading to the issue and attach the screenshot.
* Email the details to [dev-support@vlabs.ac.in](dev-support@vlabs.ac.in).