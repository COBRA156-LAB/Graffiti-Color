# Building the Desktop Version (.exe)

I have added the necessary configuration to build a desktop version of **Graffiti Color** using **Electron**.

## Prerequisites

1.  **Node.js**: Install the latest LTS version from [nodejs.org](https://nodejs.org/).
2.  **Export the Code**: In AI Studio, go to the **Settings** menu and select **Export to ZIP** or **Export to GitHub**.

## Build Steps

1.  **Extract the ZIP**: Extract the downloaded project files to a folder on your computer.
2.  **Open Terminal**: Open a terminal (Command Prompt, PowerShell, or Terminal) in that folder.
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Run in Development Mode** (Optional):
    To test the desktop app without building it:
    ```bash
    npm run electron
    ```
5.  **Build the .exe**:
    ```bash
    npm run build:electron
    ```

## Output

After the build completes, you will find the portable `.exe` file in the **`dist_electron`** folder.

---

**Note**: The build process for `.exe` files must be performed on a Windows machine (or via cross-compilation tools which are more complex). If you are on macOS or Linux, the same command will generate `.app` or `.deb` files respectively.
