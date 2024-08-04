import { Notice, Plugin, TAbstractFile, TFile } from "obsidian";

const imageExtensions = ["png", "jpg", "jpeg", "gif", "svg", "bmp", "webp"];

export default class DailyNoteCollectorPlugin extends Plugin {
	async onload() {
		// Rename event handler is not needed as long as files auto-update all links when renamed.

		this.registerEvent(
			this.app.vault.on("create", this.onCreateFile.bind(this))
		);

		this.registerEvent(
			this.app.vault.on("delete", this.onDeleteFile.bind(this))
		);
	}

	onunload() {}

	onCreateFile(file: TAbstractFile) {
		if (!(file instanceof TFile)) return;
		const link = this.getLink(file);
		const { dailyNote } = this.getDailyNote();
		if (file.path === dailyNote) {
			return;
		}
		const dailyNoteFile = this.app.vault.getFileByPath(dailyNote);
		if (!dailyNoteFile) {
			this.app.vault.create(dailyNote, `- ${link}`);
		} else {
			this.app.vault
				.process(dailyNoteFile, (content) => {
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
		const dailyNoteFile = this.app.vault.getFileByPath(dailyNote);
		if (!dailyNoteFile) {
			return;
		}
		const link = this.getLink(file);
		this.app.vault
			.process(dailyNoteFile, (content) => {
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

	getLink(file: TFile) {
		const isMarkdown = file.extension === "md";
		const imageSuffix = imageExtensions.includes(file.extension)
			? "|50"
			: "";

		const markdownLink = `[[${file.basename}]]`;
		// Use full path for non-markdown files
		const documentLink = `![[${file.path}${imageSuffix}]]`;

		return isMarkdown ? markdownLink : documentLink;
	}

	getDailyNote() {
		const date = new Date();
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		const dateKey = `${year}-${month}-${day}`;
		const dailyNote = `${dateKey}.md`;
		return {
			dailyNote,
		};
	}
}
