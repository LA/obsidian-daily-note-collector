import { Notice, Plugin, TAbstractFile, TFile } from "obsidian";
import {
	createDailyNote,
	getAllDailyNotes,
	getDailyNote,
} from "obsidian-daily-notes-interface";
import {
	DailyNoteCollectorPluginSettings,
	DEFAULT_SETTINGS,
} from "./DailyNoteCollectorPluginSettings";
import { DailyNoteCollectorSettingTab } from "./DailyNoteCollectorSettingTab";

/**
 * Daily Note Collector Plugin
 *
 * This plugin collects daily notes and adds them to the daily note.
 *
 * @remarks Rename event handler is not needed as long as files auto-update all links when renamed.
 *
 * @author https://github.com/LA
 */

export default class DailyNoteCollectorPlugin extends Plugin {
	settings: DailyNoteCollectorPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new DailyNoteCollectorSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on("delete", this.onDeleteFile.bind(this))
		);

		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(
				this.app.vault.on("create", this.onCreateFile.bind(this))
			);
		});
	}

	onunload() {}

	private shouldCollectFile(file: TFile): boolean {
		const extension = file.extension.toLowerCase();
		const { settings } = this;

		if (extension === "md" && settings.collectMarkdown) {
			return true;
		} else if (
			["png", "jpg", "jpeg", "gif", "webp"].includes(extension) &&
			settings.collectImages
		) {
			return true;
		} else if (extension === "pdf" && settings.collectPdfs) {
			return true;
		} else if (
			["mp3", "wav", "m4a"].includes(extension) &&
			settings.collectAudio
		) {
			return true;
		} else if (
			["mp4", "mov", "avi"].includes(extension) &&
			settings.collectVideos
		) {
			return true;
		} else if (extension === "excalidraw" && settings.collectExcalidraw) {
			return true;
		} else if (settings.collectOther) {
			const isSpecificKnownType =
				extension === "md" ||
				["png", "jpg", "jpeg", "gif"].includes(extension) ||
				extension === "pdf" ||
				["mp3", "wav", "m4a"].includes(extension) ||
				["mp4", "mov", "avi"].includes(extension) ||
				extension === "excalidraw";
			if (!isSpecificKnownType) {
				return true;
			}
		}
		return false;
	}

	onCreateFile(file: TAbstractFile) {
		if (!(file instanceof TFile)) return;

		if (!this.shouldCollectFile(file)) {
			return;
		}

		const link = this.app.fileManager.generateMarkdownLink(file, "");
		const { dailyNote } = this.getDailyNote();
		const promise = !dailyNote
			? createDailyNote(window.moment())
			: Promise.resolve(dailyNote);
		promise
			.then((dailyNote) => {
				if (file.path === dailyNote.path) {
					return;
				}

				return this.app.vault.process(dailyNote, (content) => {
					if (content.includes(link)) {
						return content;
					}
					// if we are at the top of the page, do not add a newline
					if (!content) {
						return `- ${link}`;
					}
					return `${content}\n- ${link}`;
				});
			})
			.catch((error) => {
				new Notice("Daily Note Collector Error: " + error);
			});
	}

	onDeleteFile(file: TAbstractFile) {
		if (!(file instanceof TFile)) return;
		const { dailyNote } = this.getDailyNote();
		if (!dailyNote) {
			return;
		}
		const link = this.app.fileManager.generateMarkdownLink(file, "");
		this.app.vault
			.process(dailyNote, (content) => {
				if (!content.includes(link)) {
					return content;
				}
				if (content.includes(`\n- ${link}`)) {
					const newContent = content.replace(`\n- ${link}`, "");
					return newContent;
				}
				if (content.includes(`- ${link}\n`)) {
					const newContent = content.replace(`- ${link}\n`, "");
					return newContent;
				}
				if (content.includes(`- ${link}`)) {
					const newContent = content.replace(`- ${link}`, "");
					return newContent;
				}
				return content;
			})
			.catch((error) => {
				new Notice("Daily Note Collector Error: " + error);
			});
	}

	private getDailyNote() {
		const allNotes = getAllDailyNotes();
		const dailyNote = getDailyNote(window.moment(), allNotes);
		return {
			dailyNote,
		};
	}

	/**
	 * Loads the plugin settings from the vault.
	 */
	private async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	/**
	 * Saves the plugin settings to the vault.
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
