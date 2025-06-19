import { Plugin, MarkdownView, Notice, TFile, Editor } from "obsidian";
import { DrupalSyncSettingTab, DEFAULT_SETTINGS, DrupalSyncSettings } from "./settings";
import { syncNoteToDrupal } from "./sync";
import * as yaml from "js-yaml";

export default class DrupalSyncPlugin extends Plugin {
  settings: DrupalSyncSettings;

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.addSettingTab(new DrupalSyncSettingTab(this.app, this));

    // Add drop button for publishing
    this.addCommand({
      id: "publish-note-to-drupal",
      name: "Save as Published",
      editorCallback: (editor, view) => {
				if (view.file) {
					this.publishNote(editor, view.file, true);
				} else {
					new Notice("No file open to publish.");
				}
			},
    });

    this.addCommand({
      id: "save-note-as-unpublished",
      name: "Save as Unpublished",
      editorCallback: (editor, view) => {
				if (view.file) {
					this.publishNote(editor, view.file, false);
				} else {
					new Notice("No file open to publish.");
				}
			},
    });

		this.addRibbonIcon("cloud-upload", "Save Note as Published to Drupal", async () => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view?.file) {
				new Notice("No active Markdown file to save.");
				return;
			}

			await this.publishNote(view.editor, view.file, true); // Default to "Published"
		});

		this.addRibbonIcon("cloud-upload", "Save Note as Unpublished to Drupal", async () => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view?.file) {
				new Notice("No active Markdown file to save.");
				return;
			}

			await this.publishNote(view.editor, view.file, false); // Default to "Published"
		});
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async publishNote(editor: Editor, file: TFile, published: boolean) {
    const fileContent = await this.app.vault.read(file);
    const { metadata, body } = this.extractFrontmatter(fileContent);
    const title = file.basename;

    const existingNodeId = metadata?.drupal_node_id;

    new Notice(`${existingNodeId ? "Updating" : "Publishing"} note to Drupal...`);

    try {
      const result = await syncNoteToDrupal(
        this.settings,
        title,
        body,
        published,
        existingNodeId
      );

      if (!result.success) {
        throw new Error(result.message || "Unknown sync error");
      }

      // Update frontmatter with node ID and URL
      metadata.drupal_node_id = result.nodeId;
      metadata.drupal_node_url = result.nodeUrl;

      const updatedContent = this.rebuildNoteWithMetadata(metadata, body);
      await this.app.vault.modify(file, updatedContent);

      new Notice("Note synced to Drupal!");
    } catch (err: any) {
      console.error("Sync failed:", err);
      new Notice(`Sync failed: ${err.message}`);
    }
  }

  /**
   * Extract frontmatter and body from note
   */
  extractFrontmatter(content: string): { metadata: any; body: string } {
    if (!content.startsWith("---")) {
      return { metadata: {}, body: content };
    }

    const end = content.indexOf("---", 3);
    if (end === -1) return { metadata: {}, body: content };

    const fmRaw = content.substring(3, end).trim();
    const body = content.substring(end + 3).trimStart();

    let metadata: any = {};
    try {
      metadata = yaml.load(fmRaw) || {};
    } catch (e) {
      console.warn("YAML parse failed", e);
    }

    return { metadata, body };
  }

  /**
   * Rebuild note content from metadata and body
   */
  rebuildNoteWithMetadata(metadata: any, body: string): string {
    const fmRaw = yaml.dump(metadata).trim();
    return `---\n${fmRaw}\n---\n\n${body}`;
  }
}
