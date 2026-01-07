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

	private isExcludedByPattern(file: TFile): boolean {
		const { settings } = this;
		if (settings.excludePattern) {
			try {
				const regex = new RegExp(settings.excludePattern);
				return regex.test(file.path);
			} catch (e) {
				// Invalid regex, ignore
			}
		}
		return false;
	}

	private shouldCollectFile(file: TFile): boolean {
		const extension = file.extension.toLowerCase();
		const { settings } = this;

		// Check if this is an Excalidraw markdown file (.excalidraw.md)
		const isExcalidrawMd = file.name.toLowerCase().endsWith(".excalidraw.md");

		if (extension === "md") {
			if (isExcalidrawMd) {
				// Treat .excalidraw.md files according to Excalidraw setting
				return settings.collectExcalidraw;
			}
			return settings.collectMarkdown;
		} else if (
			["png", "jpg", "jpeg", "gif", "webp", "svg", "heic", "heif"].includes(extension) &&
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

		// Check exclude pattern first and show notice
		if (this.isExcludedByPattern(file)) {
			new Notice(`Daily Note Collector: "${file.name}" excluded by pattern`);
			return;
		}

		if (!this.shouldCollectFile(file)) {
			return;
		}

		let link = this.app.fileManager.generateMarkdownLink(file, "");
		const isMarkdown = file.extension.toLowerCase() === "md";

		// Handle embedded links for non-markdown files
		if (!isMarkdown) {
			if (this.settings.useEmbeddedLinks && !link.startsWith("!")) {
				link = "!" + link;
			} else if (!this.settings.useEmbeddedLinks && link.startsWith("!")) {
				link = link.substring(1);
			}
		}

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

					const linkLine = `- ${link}`;
					const insertAfter = this.settings.insertAfterHeading?.trim();

					// If insert after text is specified, try to insert there
					if (insertAfter) {
						const pattern = new RegExp(`^(.*${this.escapeRegExp(insertAfter)}.*)$`, "m");
						const match = content.match(pattern);

						if (match && match.index !== undefined) {
							const matchEnd = match.index + match[0].length;
							const before = content.substring(0, matchEnd);
							const after = content.substring(matchEnd);

							// Insert right after the matched line
							if (after.startsWith("\n")) {
								return before + "\n" + linkLine + after;
							} else {
								return before + "\n" + linkLine + after;
							}
						}
						// Pattern not found, fall through to default behavior
					}

					// Default behavior: append at end
					if (!content) {
						return linkLine;
					}
					return `${content}\n${linkLine}`;
				});
			})
			.catch((error) => {
				new Notice("Daily Note Collector Error: " + error);
			});
	}

	private escapeRegExp(string: string): string {
		return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
