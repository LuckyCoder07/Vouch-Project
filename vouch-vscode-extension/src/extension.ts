import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// API URL is now retrieved from configuration

/**
 * Maps file extensions to Vouch-supported language strings.
 */
function getLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const map: { [key: string]: string } = {
        '.py': 'python',
        '.java': 'java',
        '.cpp': 'cpp',
        '.txt': 'text'
    };
    return map[ext] || 'unknown';
}

export function activate(context: vscode.ExtensionContext) {
    // COMMAND 1: Vouch This File
    let vouchFile = vscode.commands.registerCommand('vouch.vouchFile', async () => {
        // Read latest settings
        const config = vscode.workspace.getConfiguration('vouch');
        let apiKey = config.get<string>('apiKey');
        const apiUrl = config.get<string>('apiUrl', 'http://localhost:8000');

        if (!apiKey) {
            const setKey = "Set API Key";
            const choice = await vscode.window.showErrorMessage(
                "Vouch API key is not configured. Please set it in settings.",
                setKey
            );
            if (choice === setKey) {
                vscode.commands.executeCommand('workbench.action.openSettings', 'vouch.apiKey');
            }
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("Open a file to vouch it");
            return;
        }

        const filePath = editor.document.uri.fsPath;
        const studentName = await vscode.window.showInputBox({
            prompt: "Enter your name for the Vouch certificate",
            placeHolder: "Your full name"
        });

        if (!studentName) return;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Vouch: Hashing and submitting...",
            cancellable: false
        }, async () => {
            try {
                // 1. Get hashes from backend using /api/hash
                const fileBuffer = fs.readFileSync(filePath);
                
                // Constructing FormData manually for Axios Node.js compatibility
                const FormData = require('form-data');
                const form = new FormData();
                form.append('file', fileBuffer, {
                    filename: path.basename(filePath),
                    contentType: 'application/octet-stream',
                });

                const hashResponse = await axios.post(`${apiUrl}/api/hash`, form, {
                    headers: { ...form.getHeaders() }
                });

                const { structural_hash, raw_hash } = hashResponse.data;

                // 2. Submit vouch using extension-specific endpoint
                const vouchResponse = await axios.post(`${apiUrl}/api/extension/vouch`, {
                    api_key: apiKey,
                    student_name: studentName,
                    file_name: path.basename(filePath),
                    structural_hash: structural_hash,
                    raw_hash: raw_hash,
                    language: getLanguage(filePath)
                });

                const { verification_code } = vouchResponse.data;

                const choice = await vscode.window.showInformationMessage(
                    `✅ Vouched! Code: ${verification_code}`,
                    "Copy Code",
                    "View Certificate"
                );

                if (choice === "Copy Code") {
                    await vscode.env.clipboard.writeText(verification_code);
                } else if (choice === "View Certificate") {
                    vscode.env.openExternal(vscode.Uri.parse(`${apiUrl}/verify/${verification_code}`));
                }

            } catch (error: any) {
                const msg = error.response?.data?.detail || error.message;
                vscode.window.showErrorMessage(`Vouch error: ${msg}`);
            }
        });
    });

    // COMMAND 2: Verify File Integrity
    let verifyFile = vscode.commands.registerCommand('vouch.verifyFile', async () => {
        const config = vscode.workspace.getConfiguration('vouch');
        const apiUrl = config.get<string>('apiUrl', 'http://localhost:8000');

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("Open a file to verify it");
            return;
        }

        const filePath = editor.document.uri.fsPath;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Vouch: Verifying against ledger...",
            cancellable: false
        }, async () => {
            try {
                const fileBuffer = fs.readFileSync(filePath);
                const FormData = require('form-data');
                const form = new FormData();
                form.append('file', fileBuffer, {
                    filename: path.basename(filePath),
                    contentType: 'application/octet-stream',
                });

                const response = await axios.post(`${apiUrl}/api/verify`, form, {
                    headers: { ...form.getHeaders() }
                });

                const data = response.data;
                if (data.status === 'verified') {
                    vscode.window.showInformationMessage(
                        `✅ Verified! Submitted by ${data.student_name} on ${data.submitted_at}`
                    );
                } else {
                    vscode.window.showWarningMessage(
                        "❌ Not found in Vouch ledger. Use 'Vouch This File' to register it."
                    );
                }
            } catch (error: any) {
                const msg = error.response?.data?.detail || error.message;
                vscode.window.showErrorMessage(`Verification error: ${msg}`);
            }
        });
    });

    // COMMAND 3: Open Vouch Dashboard
    let openDashboard = vscode.commands.registerCommand('vouch.openDashboard', () => {
        const config = vscode.workspace.getConfiguration('vouch');
        const apiUrl = config.get<string>('apiUrl', 'http://localhost:8000');
        
        // Use the API URL base to find the dashboard (typically on port 5173 for local dev)
        // or just use the default if it's localhost
        const dashboardUrl = apiUrl.includes('localhost') ? 'http://localhost:5173' : apiUrl;
        vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
    });

    context.subscriptions.push(vouchFile, verifyFile, openDashboard);
}

export function deactivate() {}
