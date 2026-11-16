// The files the editors keep in a game's repo besides its content: the lines of the project file a level needs, and the
// editors' own settings. Used by both the page and the API, so nothing here touches a page or GitHub.

export { changeProject, type ProjectChange } from './project-lines.ts'
