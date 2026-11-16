// The files the editors keep in a game's repo besides its content: the lines of the project file a level needs, and the
// editors' own settings. Used by both the page and the API, so nothing here touches a page or GitHub.

export {
  checkEditors,
  EDITORS_DEFAULT,
  EDITORS_FILE,
  type EditorsFile,
  parseEditors,
  writeEditors,
} from './editors-file.ts'
export {
  addNote,
  answer,
  NOTES_BRANCH,
  NOTES_FILE,
  type Note,
  type NoteAnswer,
  type NotesFile,
  parseNotes,
  setDone,
  writeNotes,
} from './notes-file.ts'
export { changeProject, type ProjectChange } from './project-lines.ts'
