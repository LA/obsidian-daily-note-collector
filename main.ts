import { Notice, Plugin, TAbstractFile, TFile } from "obsidian";

export default class DailyNoteCollectorPlugin extends Plugin {
	async onload() {
		this.registerEvent(
			this.app.vault.on("create", this.onCreateFile.bind(this))
		);

		this.registerEvent(
			this.app.vault.on("rename", this.onRenameFile.bind(this))
		);

		this.registerEvent(
			this.app.vault.on("delete", this.onDeleteFile.bind(this))
		);
	}

	onunload() {}

	onCreateFile(file: TAbstractFile) {
		if (!(file instanceof TFile)) return;
		const link = `[[${this.removeExtension(file.path)}]]`;
		const { dailyNote } = this.getDailyNote();
		if (file.path === dailyNote) {
			return;
		}
		const dailyNoteFile = this.app.vault.getFileByPath(dailyNote);
		if (!dailyNoteFile) {
			this.app.vault.create(dailyNote, `- ${link}`);
		} else {
			this.app.vault
				.read(dailyNoteFile)
				.then((content) => {
					if (content.includes(link)) {
						return;
					}
					const newContent = content + `\n- ${link}`;
					this.app.vault.modify(dailyNoteFile, newContent);
				})
				.catch(() => {
					new Notice("Error updating daily note");
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
		this.app.vault.read(dailyNoteFile).then((content) => {
			const newContent = content.replace(
				`- [[${this.removeExtension(file.path)}]]`,
				""
			);
			this.app.vault.modify(dailyNoteFile, newContent);
		});
	}

	onRenameFile(file: TAbstractFile, oldPath: string) {
		/** Rename support is not necessary if you let Obsidian update existing links */
		// if (!(file instanceof TFile)) return;
		// const { dailyNote } = this.getDailyNote();
		// const dailyNoteFile = this.app.vault.getFileByPath(dailyNote);
		// if (!dailyNoteFile) {
		// 	return;
		// }
		// this.app.vault.read(dailyNoteFile).then((content) => {
		// 	const newContent = content.replace(
		// 		`[[${this.removeExtension(oldPath)}]]`,
		// 		`[[${this.removeExtension(file.path)}]]`
		// 	);
		// 	this.app.vault.modify(dailyNoteFile, newContent);
		// });
	}

	removeExtension(path: string) {
		const split = path.split(".");
		return split.slice(0, split.length - 1).join("");
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
