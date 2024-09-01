import { Notice, Plugin, TAbstractFile, TFile } from "obsidian";
import {
	createDailyNote,
	getAllDailyNotes,
	getDailyNote,
} from "obsidian-daily-notes-interface";

export default class DailyNoteCollectorPlugin extends Plugin {
	async onload() {
		// Rename event handler is not needed as long as files auto-update all links when renamed.

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

	onCreateFile(file: TAbstractFile) {
		if (!(file instanceof TFile)) return;
		const link = this.app.fileManager.generateMarkdownLink(file, "");
		const { dailyNote } = this.getDailyNote();
		if (!dailyNote) {
			createDailyNote(window.moment());
		} else {
			this.app.vault
				.process(dailyNote, (content) => {
					if (content.includes(link)) {
						return content;
					}
					// if we are at the top of the page, do not add a newline
					if (!content) {
						return `- ${link}`;
					}
					return `${content}\n- ${link}`;
				})
				.catch((error) => {
					new Notice("Daily Note Collector Error: " + error);
				});
		}
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

	getDailyNote() {
		const allNotes = getAllDailyNotes();
		const dailyNote = getDailyNote(window.moment(), allNotes);
		return {
			dailyNote,
		};
	}
}
